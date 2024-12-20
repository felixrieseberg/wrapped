import fs from "fs-extra";
import { CONFIG } from "./config.js";
import {
  Data,
  DataLight,
  GitHubDataLight,
  GitHubTotals,
  SlackChannel,
  SlackChannelLight,
  SlackUserLight,
} from "../interfaces.js";
import { getDataPath, getLightDataPath } from "../helpers/data-path.js";

/**
 * TODO: This file makes no sense and should be fixed accordingly
 */

interface SaveDataOptions {
  updateTimestap: boolean;
}

export let DATA: Data = {
  github: {},
  slack: {
    channels: {},
    users: {},
    emoji: {},
  },
  teamTotals: {},
  teamLeaders: {},
};

export async function loadData() {
  const dataPath = getDataPath(CONFIG);

  if (fs.existsSync(dataPath)) {
    try {
      // Make a backup
      await fs.copyFile(dataPath, `${dataPath}.bak`);

      DATA = await fs.readJSON(dataPath);
    } catch (error) {
      console.warn(`Failed to read data file at ${dataPath}: ${error}`);
    }
  }

  DATA.git = DATA.git || {};
  DATA.github = DATA.github || {};
  DATA.slack = DATA.slack || {
    channels: {},
    users: {},
    emoji: {},
  };
  DATA.teamTotals = DATA.teamTotals || {};
  DATA.teamLeaders = DATA.teamLeaders || {};
  DATA.createdOn = DATA.createdOn ? new Date(DATA.createdOn) : undefined;

  for (const person of CONFIG.people) {
    if (!DATA.github[person.name]) {
      DATA.github[person.name] = {
        pulls: {},
        pullsCommentedOn: {},
        pullsReviewed: {},
        pullsAllFetched: false,
        totals: getTotals(),
      };
    }

    const data = DATA.github[person.name];

    data.pulls = data.pulls || {};
    data.pullsCommentedOn = data.pullsCommentedOn || {};
    data.pullsReviewed = data.pullsReviewed || {};
    data.pullsAllFetched = data.pullsAllFetched || false;
  }

  await saveData();
}

export async function saveData(
  { updateTimestap }: SaveDataOptions = { updateTimestap: false },
) {
  // Save everything
  if (updateTimestap) {
    DATA.createdOn = new Date();
  }

  await fs.outputJSON(getDataPath(CONFIG), DATA);

  // Save the light version
  const lightData: DataLight = {
    ...DATA,
    github: getGitHubDataLight(),
    slack: getSlackDataLight(),
    createdOn: DATA.createdOn?.toISOString() || new Date().toISOString(),
  };

  await fs.outputJSON(getLightDataPath(CONFIG), lightData, { spaces: 2 });
}

function getGitHubDataLight(): Record<string, GitHubDataLight> {
  const result: Record<string, GitHubDataLight> = {};

  for (const [name, data] of Object.entries(DATA.github)) {
    result[name] = {
      ...data,
    };

    delete (result[name] as any).pulls;
    delete (result[name] as any).pullsCommentedOn;
    delete (result[name] as any).pullsReviewed;
  }

  return result;
}

function getSlackDataLight() {
  return {
    channels: getSlackChannelsLight(),
    emoji: { ...DATA.slack.emoji },
  };
}

function getSlackChannelsLight(): Record<string, SlackChannelLight> {
  const result: Record<string, SlackChannelLight> = {};

  for (const [channelId, channel] of Object.entries(DATA.slack.channels)) {
    result[channelId] = {
      ...channel,
    };

    delete (result[channelId] as any).messages;
    delete (result[channelId] as any).channel;
  }

  return result;
}

export function getTotals(): GitHubTotals {
  return {
    additions: 0,
    deletions: 0,
    changedFiles: 0,
    comments: 0,
    commits: 0,
    pulls: [],
    pullsReviewed: [],
    pullsCommentedOn: [],
    wordsInPullBodies: [],
    imagesInPullBodies: [],
    imagesPerPullAvg: 0,
    additionsPerPullAvg: 0,
    deletionsPerPullAvg: 0,
    changedFilesPerPullAvg: 0,
    wordsPerPullAvg: 0,
    pullsTestedManually: [],
    pullsTestedClient: [],
    pullsTestedBrowser: [],
    pullsTestedIntegration: [],
  };
}
