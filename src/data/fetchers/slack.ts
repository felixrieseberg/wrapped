import { WebClient } from "@slack/web-api";
import ora, { Ora } from "ora";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";

import { MessageElement } from "@slack/web-api/dist/types/response/ConversationsHistoryResponse";
import { Channel } from "@slack/web-api/dist/types/response/ConversationsListResponse.js";

import { CONFIG } from "../config.js";
import { DATA, saveData } from "../storage.js";
import {
  SlackEmoji,
  SlackMessageWithReplies,
  SlackTotals,
} from "../../interfaces.js";
import { outputMiniTable } from "../../helpers/table.js";
import { calculateWordsInString } from "../../helpers/calculate-words.js";

interface SlackOptions {
  skipFetch?: boolean;
}

/**
 * Fetches Slack data for the specified channels.
 *
 * Todo: Does not check for _new_ replies to threads if otherwise no
 * new conversations happened in the channel.
 */
export async function fetchSlack(options: SlackOptions = {}) {
  if (!CONFIG.slack) {
    console.log(
      chalk.bold(`Skipping Slack analysis because it's not configured`),
    );
    return;
  }

  const channels = await getChannels();

  for (const channelName of CONFIG.slack.channels) {
    await fetchSlackChannel(options, channelName, channels);
  }

  await findTopReacjiInChannels();
  await findTopPostersInChannels();
  await findEmojisInChannels();
  await fetchEmoji(options);
  await fetchEmojiImagesInChannels();
  findMessageCountsByDay();
  findDateWithMostMessages();
  calculateTotals();
}

async function fetchSlackChannel(
  options: SlackOptions,
  channelName: string,
  channels: Channel[],
) {
  const spinner = ora(`Loading ${channelName}...`).start();
  const channel = findChannelByName(channelName, channels);

  if (!channel || !channel.id) {
    spinner.fail(`Channel not found: ${channelName}`);
    return;
  }

  DATA.slack.channels[channelName] = DATA.slack.channels[channelName] || {};
  DATA.slack.channels[channelName].channel = channel;

  if (options.skipFetch) {
    spinner.succeed(`Skipping fetch of ${channelName}, skipFetch is set`);
    return;
  }

  const latestMessageInData = DATA.slack.channels[channelName].messages?.[0];
  const latestMessageInChannel = await fetchLatestMessage(channel);
  const hasNewMessages = latestMessageInData?.ts !== latestMessageInChannel?.ts;

  if (!hasNewMessages) {
    spinner.succeed(`No new messages in ${channelName}`);
    return;
  }

  DATA.slack.channels[channelName].channel = channel;

  spinner.succeed(`Loaded ${channelName}`);

  await fetchMessages(channel);
  await fetchAllRepliesForAllThreads(channel);

  // Calculate the number of messages and replies
  DATA.slack.channels[channelName].messageCount =
    DATA.slack.channels[channelName].messages?.length || 0;
  DATA.slack.channels[channelName].messageCount =
    DATA.slack.channels[channelName].messageCount! +
    (DATA.slack.channels[channelName].messages?.reduce((total, message) => {
      return total + (message.replies?.length || 0);
    }, 0) || 0);

  await saveData();
}

async function fetchSlackUserById(userId: string) {
  if (!DATA.slack.users[userId]) {
    const client = getWebClient();
    const user = await client.users.info({
      user: userId,
    });

    if (!user.ok || !user.user) {
      throw new Error(`Failed to fetch user ${userId}: ${user.error}`);
    }

    DATA.slack.users[userId] = user.user;
  }

  return DATA.slack.users[userId];
}

/**
 * Returns a user's name if it can be found in the config.
 */
async function getPersonNameBySlackUserId(userId?: string) {
  if (!userId) {
    return null;
  }

  const user = await fetchSlackUserById(userId);
  const personInConfig = CONFIG.people.find((person) => {
    return user.real_name === person.name || user.name === person.slack;
  });

  if (personInConfig) {
    return personInConfig.name;
  }

  return null;
}

let _client: WebClient | null = null;
function getWebClient() {
  if (!CONFIG.slack) {
    throw new Error(`Slack not configured`);
  }

  if (!_client) {
    _client = new WebClient(CONFIG.slack.token);
  }

  return _client;
}

function findChannelByName(name: string, channels: Channel[]) {
  // Find the channel with the specified name
  const channel = channels.find((c) => c.name === name);

  if (channel) {
    return channel; // Return the channel ID if found
  }

  return null;
}

async function getChannels(): Promise<Channel[]> {
  if (!CONFIG.slack) {
    throw new Error(`Slack not configured`);
  }

  const spinner = ora(`Fetching Slack channels`).start();
  const client = getWebClient();
  const channels: Channel[] = Object.keys(DATA.slack.channels).map(
    (channelName) => DATA.slack.channels[channelName].channel,
  );
  let cursor = "";

  const hasAllChannelsInConfig = () => {
    return CONFIG.slack?.channels.every((channelName) => {
      return channels.some((channel) => channel.name === channelName);
    });
  };

  while (!hasAllChannelsInConfig()) {
    // Fetch a list of channels with pagination
    const channelsResponse = await client.conversations.list({
      cursor, // Pass the cursor to continue fetching
      exclude_archived: true, // Exclude archived channels
      types: "public_channel", // Only fetch public channels
    });

    if (!channelsResponse.channels || channelsResponse.channels.length === 0) {
      break;
    }

    spinner.text = `Fetching Slack channels (${channels.length} so far)`;
    channels.push(...channelsResponse.channels);

    if (
      !channelsResponse.response_metadata ||
      !channelsResponse.response_metadata.next_cursor
    ) {
      break;
    }

    // Update the cursor for the next page of channels
    cursor = channelsResponse.response_metadata.next_cursor;
  }

  spinner.succeed(
    `Fetched ${channels.length} Slack channels (and all configured ones)`,
  );

  return channels;
}

async function fetchAllRepliesForAllThreads(channel: Channel) {
  if (!channel.name) {
    throw new Error(`Channel name not found for ${channel.id}`);
  }

  if (!DATA.slack.channels[channel.name]) {
    throw new Error(
      `No local data found for ${channel.name}. You have to first fetch messages!`,
    );
  }

  const client = getWebClient();
  const allMessages = DATA.slack.channels[channel.name].messages || [];
  let cursor = "";

  // Filter out messages that are not the start of a thread
  const threadStarters = allMessages.filter((message) => message.thread_ts);
  const spinner = ora(
    `Fetching Slack replies for ${threadStarters.length} threads in ${channel.name}`,
  ).start();

  for (const [index, threadStarter] of threadStarters.entries()) {
    if (!threadStarter.ts) {
      continue;
    }

    spinner.text = `Fetching Slack replies for ${index + 1}/${threadStarters.length} threads in ${channel.name}`;

    try {
      while (true) {
        const repliesResponse = await client.conversations.replies({
          channel: channel.id!,
          ts: threadStarter.ts,
          cursor,
        });

        if (
          !repliesResponse.messages ||
          repliesResponse.messages.length === 0
        ) {
          break;
        }

        threadStarter.replies = (threadStarter.replies || []).concat(
          repliesResponse.messages,
        );

        if (
          !repliesResponse.response_metadata ||
          !repliesResponse.response_metadata.next_cursor
        ) {
          break;
        }

        cursor = repliesResponse.response_metadata.next_cursor;
      }
    } catch (error) {
      console.error(
        `Failed to fetch replies for thread ${threadStarter.ts} in channel ${channel.name}: ${error}`,
      );
    }
  }

  spinner.succeed(
    `Fetched Slack replies for ${threadStarters.length} threads in ${channel.name}`,
  );
}

async function fetchMessages(channel: Channel) {
  if (!channel.name) {
    throw new Error(`Channel name not found for ${channel.id}`);
  }

  const spinner = ora(`Fetching Slack messages for `).start();
  const client = getWebClient();
  const latest = Math.floor(CONFIG.to.getTime() / 1000).toString();
  const oldest = Math.floor(CONFIG.from.getTime() / 1000).toString();
  let allMessages: MessageElement[] = [];
  let cursor = "";

  try {
    while (true) {
      const messagesResponse = await client.conversations.history({
        channel: channel.id!,
        latest,
        oldest,
        cursor,
      });

      if (
        !messagesResponse.messages ||
        messagesResponse.messages.length === 0
      ) {
        break;
      }

      allMessages = allMessages.concat(messagesResponse.messages);

      if (
        !messagesResponse.response_metadata ||
        !messagesResponse.response_metadata.next_cursor
      ) {
        break;
      }

      spinner.text = `Fetching Slack messages (${allMessages.length} so far)`;
      cursor = messagesResponse.response_metadata.next_cursor;
    }

    spinner.succeed(
      `Fetched ${allMessages.length} Slack messages for ${channel.name}`,
    );

    DATA.slack.channels[channel.name].messages = allMessages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}

async function fetchLatestMessage(channel: Channel) {
  if (!channel.id) {
    throw new Error(`Channel ID not found for ${channel.name}`);
  }

  const response = await getWebClient().conversations.history({
    channel: channel.id,
    inclusive: true,
    limit: 1,
  });

  const latest =
    response && response.messages ? response.messages[0] : undefined;

  return latest;
}

function findDateWithMostMessages() {
  if (!CONFIG.slack) {
    throw new Error(`Slack not configured`);
  }

  for (const channelName of CONFIG.slack.channels) {
    const spinner = ora(`Finding message counts by day in ${channelName}...`);
    const channel = DATA.slack.channels[channelName];

    if (!channel) {
      spinner.fail(`Channel not found: ${channelName}`);
      continue;
    }

    const messageCountsByDate: Record<string, number> = {};

    const forEachMessage = (message: SlackMessageWithReplies) => {
      if (!message.ts) {
        return;
      }

      const timestamp = new Date(parseInt(message.ts) * 1000); // Convert seconds to milliseconds
      const date = timestamp.toISOString().split("T")[0]; // Extract the day part

      if (messageCountsByDate[date]) {
        messageCountsByDate[date]++;
      } else {
        messageCountsByDate[date] = 1;
      }
    };

    (channel.messages || []).forEach((message) => {
      forEachMessage(message);

      if (message.replies) {
        message.replies.forEach(forEachMessage);
      }
    });

    let mostMessagesDay: string | null = null;
    let maxMessagesCount = 0;

    for (const day in messageCountsByDate) {
      if (messageCountsByDate[day] > maxMessagesCount) {
        mostMessagesDay = day;
        maxMessagesCount = messageCountsByDate[day];
      }
    }

    DATA.slack.channels[channelName].dayWithMostMessages = {
      day: mostMessagesDay!,
      count: maxMessagesCount,
    };

    spinner.succeed(
      `Busiest day in ${channelName}: ${mostMessagesDay} with ${maxMessagesCount} messages`,
    );
  }
}

function findMessageCountsByDay() {
  if (!CONFIG.slack) {
    throw new Error(`Slack not configured`);
  }

  for (const channelName of CONFIG.slack.channels) {
    const spinner = ora(`Finding message counts by day in ${channelName}...`);
    const channel = DATA.slack.channels[channelName];

    if (!channel) {
      spinner.fail(`Channel not found: ${channelName}`);
      continue;
    }

    channel.messageCountByDay = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };

    const forEachMessage = (message: SlackMessageWithReplies) => {
      if (!message.ts) {
        return;
      }

      const timestamp = new Date(parseInt(message.ts) * 1000); // Convert seconds to milliseconds
      const dayOfWeek = timestamp.toLocaleDateString(undefined, {
        weekday: "long",
      }); // Get the full day name

      if (channel.messageCountByDay![dayOfWeek]) {
        channel.messageCountByDay![dayOfWeek]++;
      } else {
        channel.messageCountByDay![dayOfWeek] = 1;
      }
    };

    (channel.messages || []).forEach((message) => {
      forEachMessage(message);

      if (message.replies) {
        message.replies.forEach(forEachMessage);
      }
    });

    spinner.succeed(`Found message counts by day in ${channelName}:`);
    const rows = [["Day", "Messages"]];
    Object.entries(channel.messageCountByDay!).forEach(([day, count]) => {
      rows.push([day, count.toString()]);
    });
    outputMiniTable(rows, true);
  }
}

async function findTopPostersInChannels() {
  if (!CONFIG.slack) {
    throw new Error(`Slack not configured`);
  }

  for (const channelName of CONFIG.slack.channels) {
    const channel = DATA.slack.channels[channelName];

    if (!channel) {
      continue;
    }

    const spinner = ora(`Finding top posters in ${channelName}...`).start();
    const topPosters = await findTopPoster(channel.messages || [], spinner);
    const topPostersWithName: Record<string, number> = {};

    for (const [userId, count] of topPosters) {
      spinner.text = `Loading user details for user ${userId}...`;
      const user = await fetchSlackUserById(userId);
      topPostersWithName[user.real_name || user.name || userId] = count;
    }

    spinner.succeed(`Found top posters in ${channelName}:`);

    const rows = [["Poster", "Messages"]];
    Object.entries(topPostersWithName).forEach(([poster, count]) => {
      rows.push([poster, count.toString()]);
    });
    outputMiniTable(rows, true);

    DATA.slack.channels[channelName].topPosters = topPostersWithName;
  }
}

async function findTopPoster(
  messages: SlackMessageWithReplies[],
  spinner: Ora,
): Promise<Map<string, number>> {
  const posterCountMap = new Map<string, number>();

  for (const message of messages) {
    if (message.user) {
      posterCountMap.set(
        message.user,
        (posterCountMap.get(message.user) || 0) + 1,
      );
    }

    if (message.replies) {
      const replies = await findTopPoster(message.replies, spinner);

      for (const [poster, count] of replies.entries()) {
        posterCountMap.set(poster, (posterCountMap.get(poster) || 0) + count);
      }
    }
  }

  // Sort the posters by count in descending order
  const sortedPosters = [...posterCountMap.entries()].sort(
    (a, b) => b[1] - a[1],
  );
  const top10Posters = sortedPosters.slice(0, 10);

  return new Map(top10Posters);
}

async function findTopReacjiInChannels() {
  if (!CONFIG.slack) {
    throw new Error(`Slack not configured`);
  }

  for (const channelName of CONFIG.slack.channels) {
    const channel = DATA.slack.channels[channelName];

    if (!channel) {
      continue;
    }

    const reacji = await findReacji(channel.messages || []);

    console.log(`Top reacji in ${channelName}:\n`);
    const rows = [["Emoji", "Count"]];
    Object.entries(reacji).forEach(([emoji, count]) => {
      rows.push([emoji, count.toString()]);
    });
    outputMiniTable(rows.slice(0, 20));
    console.log();

    DATA.slack.channels[channelName].reacji = reacji;
  }
}

async function findReacji(
  messages: SlackMessageWithReplies[],
): Promise<Record<string, number>> {
  const reacjiCountMap = new Map<string, number>();

  for (const message of messages) {
    if (message.reactions) {
      for (const reaction of message.reactions) {
        if (reaction.name) {
          reacjiCountMap.set(
            reaction.name,
            (reacjiCountMap.get(reaction.name) || 0) + (reaction.count || 0),
          );
        }
      }
    }

    if (message.replies) {
      const replies = await findReacji(message.replies);

      for (const [reacji, count] of Object.entries(replies)) {
        reacjiCountMap.set(reacji, (reacjiCountMap.get(reacji) || 0) + count);
      }
    }
  }

  // Sort the reacjis by count in descending order
  const sortedReacji = [...reacjiCountMap.entries()].sort(
    (a, b) => b[1] - a[1],
  );

  return Object.fromEntries(sortedReacji);
}

async function findEmojisInChannels() {
  if (!CONFIG.slack) {
    throw new Error(`Slack not configured`);
  }

  for (const channelName of CONFIG.slack.channels) {
    const spinner = ora(`Finding emojis in ${channelName}...`).start();
    const channel = DATA.slack.channels[channelName];

    if (!channel) {
      spinner.fail(`Channel not found: ${channelName}`);
      continue;
    }

    const emojis = await findEmojis(channel.messages || []);

    spinner.succeed(
      `Found ${Object.keys(emojis.byCount).length} emojis in ${channelName}`,
    );
    DATA.slack.channels[channelName].emojis = emojis;
  }
}

async function findEmojis(
  messages: SlackMessageWithReplies[],
): Promise<SlackEmoji> {
  if (!CONFIG.slack) {
    throw new Error(`Slack not configured`);
  }

  const emojiRegex = /:\w+:/g;
  const result: SlackEmoji = {
    byCount: {},
    byPerson: {},
  };

  for (const message of messages) {
    const text = message.text || "";
    const emojis = text.match(emojiRegex);
    const person = await getPersonNameBySlackUserId(message.user);

    if (emojis) {
      if (person && !result.byPerson[person]) {
        result.byPerson[person] = {};
      }

      emojis.forEach((emoji) => {
        const emojiName = emoji.replace(/:/g, "");

        // We ignore emoji that are just a number, because they're likely
        // just from a code snippet.
        if (/^\d+$/.test(emojiName)) {
          return;
        }

        if (CONFIG.slack?.ignoreEmoji?.includes(emojiName)) {
          return;
        }

        const count = result.byCount[emojiName] || 0;
        result.byCount[emojiName] = count + 1;

        if (person) {
          result.byPerson[person][emojiName] =
            (result.byPerson[person][emojiName] || 0) + 1;
        }
      });
    }

    if (message.replies) {
      const replyEmoji = await findEmojis(message.replies);

      for (const [emoji, count] of Object.entries(replyEmoji.byCount)) {
        result.byCount[emoji] = (result.byCount[emoji] || 0) + count;
      }

      for (const user of Object.keys(replyEmoji.byPerson)) {
        if (!result.byPerson[user]) {
          result.byPerson[user] = {};
        }

        for (const [emoji, count] of Object.entries(
          replyEmoji.byPerson[user],
        )) {
          result.byPerson[user][emoji] =
            (result.byPerson[user][emoji] || 0) + count;
        }
      }
    }
  }

  return result;
}

async function fetchEmoji(options: SlackOptions) {
  if (options.skipFetch) {
    return;
  }

  const client = getWebClient();
  const emojiResponse = await client.emoji.list({});

  if (!emojiResponse.ok || !emojiResponse.emoji) {
    throw new Error(`Failed to fetch emoji: ${emojiResponse.error}`);
  }

  DATA.slack.emoji = emojiResponse.emoji;
}

async function fetchEmojiImagesInChannels() {
  if (!CONFIG.slack) {
    throw new Error(`Slack not configured`);
  }

  for (const channel of CONFIG.slack.channels) {
    const channelData = DATA.slack.channels[channel];

    if (!channelData) {
      continue;
    }

    const spinner = ora(`Downloading emoji images in ${channel}...`).start();
    const emojiArr = Object.entries(channelData.emojis || {});

    for (const [index, emoji] of emojiArr.entries()) {
      spinner.text = `Downloading emoji images in ${channel} (${index}/${emojiArr.length})...`;
      const url = DATA.slack.emoji[emoji[0]];
      const outPath = path.join(
        process.cwd(),
        "public",
        "emoji",
        `${emoji[0]}.png`,
      );

      if (!url || url.startsWith("alias") || fs.existsSync(outPath)) {
        continue;
      }

      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        await fs.outputFile(outPath, Buffer.from(arrayBuffer));
      } catch (error) {
        console.log(
          `Failed to download emoji ${emoji[0]} from ${url}: ${error}`,
        );
      }
    }

    spinner.succeed(`Downloaded emoji images in ${channel}`);
  }
}

function calculateTotals() {
  const totals: SlackTotals = {
    messages: 0,
    words: 0,
    reactions: 0,
    emojis: 0,
  };

  totals.messages = Object.values(DATA.slack.channels).reduce(
    (total, channel) => {
      const messages = channel.messages?.length || 0;
      const replies =
        channel.messages?.reduce((total, message) => {
          return total + (message.replies?.length || 0);
        }, 0) || 0;

      return total + messages + replies;
    },
    0,
  );

  totals.words = Object.values(DATA.slack.channels).reduce((total, channel) => {
    const words =
      channel.messages?.reduce((total, message) => {
        const wordsInMessage = calculateWordsInString(message?.text);
        const wordsInReplies =
          message?.replies?.reduce((total, message) => {
            return total + calculateWordsInString(message?.text);
          }, 0) || 0;

        return total + wordsInReplies + wordsInMessage;
      }, 0) || 0;

    return total + words;
  }, 0);

  totals.reactions = Object.values(DATA.slack.channels).reduce(
    (total, channel) => {
      return (
        total +
        Object.values(channel.reacji || {}).reduce((total, count) => {
          return total + count;
        }, 0)
      );
    },
    0,
  );

  totals.emojis = Object.values(DATA.slack.channels).reduce(
    (total, channel) => {
      return total + (Object.keys(channel.emojis?.byCount || {}).length || 0);
    },
    0,
  );

  DATA.teamTotals = DATA.teamTotals || {};
  DATA.teamTotals.slack = totals;
}
