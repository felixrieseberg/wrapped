import { Story } from "react-insta-stories/dist/interfaces";
import { Homemade_Apple } from "next/font/google";

import { DataLight, StoryFunc } from "../../interfaces";
import { formatNumber as n } from "../../helpers/format";
import { joined } from "../helpers/joined";
import { formatDate } from "../helpers/simple-date";
import BarChart from "../components/bar-chart";
import RandomEmojiBackground from "../components/emoji-background";
import Emoji from "../components/emoji";

const homemadeApple = Homemade_Apple({ subsets: ["latin"], weight: "400" });

const SlackStories: StoryFunc = (data, config) => {
  if (!config.slack) {
    return [];
  }

  const stories: Story[] = [
    ...EmojiCharts(data, config),
    ...BufoCharts(data, config),
    ...ChannelSummaries(data, config),
  ];

  return stories;
};

const EmojiCharts: StoryFunc = (data, config) => {
  const elements: Array<JSX.Element> = [];

  if (!config.slack) {
    return [];
  }


  for (const channelName of config.slack.channels) {
    const channelData = data.slack.channels[channelName];
    const favoriteEmoji = getSortedEmoji(channelData.emojis!.byCount);
    const emojiList = EmojiList(favoriteEmoji, data);
    const uniqueEmojis = new Set();
    Object.keys(channelData.emojis!.byCount).forEach(emoji => uniqueEmojis.add(emoji));

    elements.push(
      <div className="mb-[30px]">
        <p className={`${homemadeApple.className} text-2xl`}>#{channelName}</p>
        <div className="mb-[10px]">{emojiList}</div>
        <p className="text-sm text-gray-600">We used {uniqueEmojis.size} unique emojis in 2024</p>
      </div>,
    );
  }

  return [
    {
      content: (props) => (
        <div className="text-black text-center w-full h-full bg-cover bg-notion-paper">
          <RandomEmojiBackground />
          <div className="w-full h-full p-8 pt-20">
            <p className={`${homemadeApple.className} text-6xl`}>
              Emoji Charts
            </p>
            <p className="mb-[20px] text-2xl">{config.periodName}</p>
            {elements}
          </div>
        </div>
      ),
    },
  ];
};

const BufoCharts: StoryFunc = (data, config) => {
  const elements: Array<JSX.Element> = [];

  if (!config.slack) {
    return [];
  }

  for (const channelName of config.slack.channels) {
    const channelData = data.slack.channels[channelName];
    const favoriteEmoji = getSortedEmoji(channelData.emojis!.byCount, 7, (emoji) => {
      return emoji.startsWith("bufo")
    });
    const emojiList = EmojiList(favoriteEmoji, data);

    // Count unique bufo emojis
    const uniqueBufoCount = Object.keys(channelData.emojis!.byCount).filter(emoji => 
      emoji.startsWith("bufo")
    ).length;

    elements.push(
      <div className="mb-[30px]">
        <p className={`${homemadeApple.className} text-2xl`}>#{channelName}</p>
        <div className="mb-[10px]">{emojiList}</div>
        <p className="text-sm text-gray-600">We used {uniqueBufoCount} unique bufos in 2024</p>
      </div>,
    );
  }

  return [
    {
      content: (props) => (
        <div className="text-black text-center w-full h-full bg-cover bg-notion-paper">
          <RandomEmojiBackground />
          <div className="w-full h-full p-8 pt-20">
            <p className={`${homemadeApple.className} text-6xl`}>
              Bufo Charts
            </p>
            <p className="mb-[20px] text-2xl">{config.periodName}</p>
            {elements}
          </div>
        </div>
      ),
    },
  ];
};

const ChannelSummaries: StoryFunc = (data, config) => {
  const stories: Story[] = [];

  if (!config.slack) {
    return [];
  }

  for (const channelName of config.slack.channels) {
    const channelData = data.slack.channels[channelName];

    if (!channelData) {
      console.log(`No data for channel ${channelName}`);
      continue;
    }

    const dayWithMostMessages = formatDate(
      channelData.dayWithMostMessages!.day,
    );
    const favoriteReacji = getSortedEmoji(channelData.reacji!, 6);
    const reacjiList = EmojiList(favoriteReacji, data);
    const topPostersWithoutBots: Record<string, number> = {};
    const topPostersOnlyBots: Record<string, number> = {};

    // Filter out bots
    for (const [name, count] of Object.entries(channelData.topPosters!)) {
      if (!(config.slack.ignoreBots || []).includes(name)) {
        topPostersWithoutBots[name] = count;
      } else {
        topPostersOnlyBots[name] = count;
      }
    }

    let botsContentsMaybe = <></>;

    if (Object.keys(topPostersOnlyBots).length > 0) {
      botsContentsMaybe = <p className="mt-[30px]">Our top 3 busiest bots were {recordToNameAndNumber(topPostersOnlyBots, "messages", 3)}.</p>;
    }

    stories.push(
      {
        content: (props) => (
          <div className="text-black text-center w-full h-full p-8 bg-notion-paper pt-20">
            <p className={`${homemadeApple.className} text-2xl`}>
              #{channelName}
            </p>
            <p className="mt-[30px]">
              In {config.periodName},{" "}
              <span className="font-bold">
                {n(channelData.messageCount)} messages
              </span>{" "}
              were written. The top 3 chatterbugs were{" "}
              {recordToNameAndNumber(topPostersWithoutBots, "messages", 3)}.
            </p>
            {botsContentsMaybe}
            <div>
              <p className={`mt-[30px] text-xl ${homemadeApple.className}`}>
                Reacji Charts
              </p>
              <p>{reacjiList}</p>
            </div>
          </div>
        ),
      },
      {
        content: (props) => (
          <div className="bg-[conic-gradient(at_top_right,var(--tw-gradient-stops))] from-black via-gray-800 to-white text-center w-full h-full p-8 bg-cover pt-20">
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-25 brightness-100 contrast-150"></div>
            <p className={`${homemadeApple.className} text-2xl`}>
              #{channelName}
            </p>
            <p className="mt-[30px]">
              The day with the most messages was {dayWithMostMessages} with{" "}
              {n(channelData.dayWithMostMessages!.count)} messages.
            </p>
            <BarChart
              data={channelData.messageCountByDay!}
              barClassName="bg-white text-black"
            />
          </div>
        ),
      },
    );
  }

  return stories;
};

const EmojiList = (
  input: Array<{ emoji: string; count: number }>,
  data: DataLight,
) => {
  const result = [];

  for (const [i, emoji] of input.entries()) {
    const transformed = <Emoji data={data} name={emoji.emoji} />;
    const separator =
      i === input.length - 1 ? "" : i === input.length - 2 ? ", and " : ", ";

    result.push(
      <>
        <span className="text-2xl">{transformed}</span> × {emoji.count}
        {separator}
      </>,
    );
  }

  return result;
};

function recordToNameAndNumber(
  record: Record<string, number>,
  unit: string,
  length?: number,
): string {
  const array = Object.entries(record).map(([name, count]) => ({
    name,
    count,
  }));
  let sorted = array.sort((a, b) => b.count - a.count);
  if (length) {
    sorted = sorted.slice(0, length);
  }

  return joined(
    sorted.map((x) => `${x.name} (${n(x.count)}${unit ? ` ${unit}` : ""})`),
  );
}

function getWeekdayWithMostMessages(input: Record<string, number>): string {
  const array = Object.entries(input).map(([day, count]) => ({ day, count }));
  const sorted = array.sort((a, b) => b.count - a.count);

  return sorted[0].day;
}

function getSortedEmoji(input: Record<string, number>, length: number = 7, filter: (emoji: string) => boolean = () => true) {
  const array = Object.entries(input).map(([emoji, count]) => ({
    emoji,
    count,
  })).filter(({ emoji }) => filter(emoji));
  const sorted = array.sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, length);

  return top;
}

export default SlackStories;
