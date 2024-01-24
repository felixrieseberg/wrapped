import type { Story } from "react-insta-stories/dist/interfaces";
import { MessageElement } from "@slack/web-api/dist/types/response/ConversationsHistoryResponse";

import type { Config } from "./data/config";
import { Channel } from "@slack/web-api/dist/types/response/ConversationsListResponse";
import { User } from "@slack/web-api/dist/types/response/UsersLookupByEmailResponse";
import { Profile } from "@slack/web-api/dist/types/response/UsersProfileGetResponse";

export type StoryFunc = (data: DataLight, config: Config) => Story[];

export interface CommonOptions {
  out: string;
  config: string;
}

export type SlackChannelLight = Omit<SlackChannel, "messages" | "channel">;
export type SlackUserLight = Pick<User, "name" | "real_name">;
export type GitHubDataLight = Omit<
  GitHubData,
  "pulls" | "pullsReviewed" | "pullsCommentedOn"
>;
export interface SlackDataLight {
  channels: Record<string, SlackChannelLight>;
  emoji: Record<string, string>;
}

/**
 * Data as used by the web app
 */
export interface DataLight {
  github: Record<string, GitHubDataLight>;
  git: Record<string, GitData>;
  slack: SlackDataLight;
  teamTotals: {
    github?: GitHubTeamTotals;
  };
  teamLeaders: {
    github?: GitHubLeaders;
  };
  createdOn: string;
}

/**
 * Data as used by the cli
 */
export interface Data {
  github: Record<string, GitHubData>;
  git: Record<string, GitData>;
  slack: SlackData;
  teamTotals: {
    github?: GitHubTeamTotals;
    slack?: SlackTotals;
  };
  teamLeaders: {
    github?: GitHubLeaders;
  };
  createdOn?: Date;
}

export interface SlackTotals {
  messages: number;
  words: number;
  reactions: number;
  emojis: number;
}

export interface SlackData {
  channels: Record<string, SlackChannel>;
  users: Record<string, User>;
  emoji: Record<string, string>;
}

export interface SlackChannel {
  channel: Channel;
  messages?: Array<SlackMessageWithReplies>;
  messageCount?: number;
  reacji?: Record<string, number>;
  topPosters?: Record<string, number>;
  emojis?: SlackEmoji;
  messageCountByDay?: Record<string, number>;
  dayWithMostMessages?: {
    day: string;
    count: number;
  };
}

export interface SlackEmoji {
  byCount: Record<string, number>;
  byPerson: Record<string, Record<string, number>>;
}

export interface SlackMessageWithReplies extends MessageElement {
  replies?: Array<MessageElement>;
}

export type SavedSlackMessages = Required<SlackChannel>;

export interface GitData {
  linesChanged: number;
  commitAtFrom: string;
  commitAtTo: string;
}

export interface GitHubTestType {
  manual: boolean;
  unit: boolean;
  client: boolean;
  integration: boolean;
  browser: boolean;
}

export interface GitHubTotals {
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: number;
  commits: number;
  pulls: Array<number>;
  pullsReviewed: Array<number>;
  pullsCommentedOn: Array<number>;
  wordsInPullBodies: Array<number>;
  additionsPerPullAvg: number;
  deletionsPerPullAvg: number;
  changedFilesPerPullAvg: number;
  wordsPerPullAvg: number;
  pullsTestedManually: Array<number>;
  pullsTestedClient: Array<number>;
  pullsTestedBrowser: Array<number>;
  pullsTestedIntegration: Array<number>;
}

export interface GitHubTeamTotals {
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: number;
  commits: number;
  pulls: number;
  wordsInPullBodies: number;
  pullsReviewed: number;
  pullsCommentedOn: number;
  additionsPerPullAvg: number;
  deletionsPerPullAvg: number;
  changedFilesPerPullAvg: number;
  additionsPerPullMed: number;
  deletionsPerPullMed: number;
  changedFilesPerPullMed: number;
  pullsTestedManually: number;
  pullsTestedClient: number;
  pullsTestedBrowser: number;
  pullsTestedIntegration: number;
}

export interface Leaders {
  names: Array<string>;
  value: number;
}

export type GitHubLeaders = Record<keyof GitHubTotals, Leaders>;

export interface GitHubData {
  pulls: Record<number, PullRequest>;
  pullsReviewed: Record<number, GitHubPullRequest>;
  pullsCommentedOn: Record<number, GitHubPullRequest>;
  pullsAllFetched: boolean;
  totals: GitHubTotals;
}

export interface PullRequest {
  title: string;
  url: string;
  comments: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  createdAt: Date;
  commits: number;
  number: number;
  body: string;
  reactions: GitHubReactions;
}

interface GitHubReactions {
  url: string;
  total_count: number;
  "+1": number;
  "-1": number;
  laugh: number;
  hooray: number;
  confused: number;
  heart: number;
  rocket: number;
  eyes: number;
}

export interface GitHubPullRequest {
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  id: number;
  node_id: string;
  number: number;
  title: string;
  user: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  labels: any[]; // You can replace 'any[]' with a more specific type for labels
  state: string;
  locked: boolean;
  assignee: null | any; // You can replace 'any' with a more specific type for assignee
  assignees: any[]; // You can replace 'any[]' with a more specific type for assignees
  milestone: null | any; // You can replace 'any' with a more specific type for milestone
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string;
  author_association: string;
  active_lock_reason: null | string;
  draft: boolean;
  pull_request: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
    merged_at: string;
  };
  body: string;
  reactions: GitHubReactions;
  timeline_url: string;
  performed_via_github_app: null | string;
  state_reason: null | string;
  score: number;
}
