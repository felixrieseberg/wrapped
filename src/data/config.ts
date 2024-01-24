import fs from "fs-extra";

export interface Config {
  // What's the name of your team? Example: "Web Infra"
  teamName: string;
  // When do you want to start? Pass this in as a string that can be
  // parsed with new Date(). Example: "2020-01-01"
  from: Date;
  // When do you want to end? Pass this in as a string that can be
  // parsed with new Date(). Example: "2020-01-01"
  to: Date;
  // What's the name of the period you're wrapping up? Example: "fy 2023"
  periodName: string;
  // Who are the people on your team? See the Person interface below.
  people: Array<Person>;
  // Configure the Git integration, which will fetch statistics about
  // commits. If not provided, this tool will not fetch any Git data.
  git?: GitConfig;
  // Configure the GitHub integration, which will fetch statistics about
  // pull requests.
  github?: GitHubConfig;
  // Configure the Slack integration, which will fetch statistics about
  // messages and reactions.
  slack?: SlackConfig;
  // Any projects you're proud of?
  projects?: Array<string>;
}

export interface GitConfig {
  // Full path to the repository.
  // Example: "/Users/felix/code/wrapped"
  repoPath: string;
  // Individual folders within that repository that should be
  // included in the analysis. Useful for monorepos where your
  // team owns individual folders.
  // Example: ["src/desktop", "src/client"]
  folders: Array<string>;
}

export interface GitHubConfig {
  // A GitHub personal access token used to talk to the GitHub API.
  // To create one, visit https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
  //
  // If you do not provide a token, this tool will not fetch any GitHub
  // data.
  //
  // Example: "ghp_..."
  token: string;
  // The owner of the repo you're looking at. If your repo lives at
  // https://github.com/felixrieseberg/wrapped, you'd enter "felixrieseberg"
  //
  // Example: "felixrieseberg"
  owner: string;
  // The repo you're looking at. If your repo lives at
  // https://github.com/felixrieseberg/wrapped, you'd enter "wrapped".
  //
  // Example: "wrapped"
  repo: string;
}

export interface SlackConfig {
  // A Slack token used to access the Slack API.
  //
  // If you do not provide a token, this tool will not fetch any Slack
  // data.
  //
  // Example: "xoxp-...""
  token: string;
  // A (small) number of channels to pull data from. Warning: This tool
  // will fetch _all_ messages and thread replies for these channels during
  // your specified "from" and "to" dates. If you have a large Slack team,
  // consider limiting the number of channels. I'm recommending one or two.
  //
  // Example: ["general", "random"]
  channels: Array<string>;
  // Maybe you have bots posting specific emoji, making the data a
  // little useless. You can ignore them here.
  ignoreEmoji: Array<string>;
}

export interface Person {
  // What's the person's full name?
  name: string;
  // What's the person's GitHub username? If none is provided,
  // we will skip them during GitHub data fetching.
  github?: string;
  // We'll assume that the Slack real_name matches the name property here.
  // If it doesn't, you can specify it here. It will then be matched
  // against Slack's "name" property.
  slack?: string;
  // Some people aren't on the team for the entire period. You can specify
  // a custom period just for this one person. This is useful if someone
  // was on your team from January to March, but then joined another team -
  // and you don't want to claim credit for their work.
  from?: Date;
  to?: Date;
  // If you want to exclude someone from the leaderboard, you can do so.
  // For instance useful if you're a manager and you don't want to
  // celebrate your own GitHub accomplishments.
  excludeFromLeaderboard?: boolean;
  // Is this person new on your team? Set this to "true" and we'll include
  // them in a "Welcome to the team" story.
  new?: boolean;
  // A path to a photo of the person. Place the photo itself in /public.
  // If the photo is placed in /public/photos/felix.jpg, you'd enter
  // "/photos/felix.jpg". You can also specify a URL.
  //
  // Example: "/photos/felix.jpg"
  photo?: string;
  // If specified, we'll add a story for this person that features the
  // highlight photo as a background and displays a caption.
  highlight?: {
    // If the photo is placed in /public/photos/felix.jpg, you'd enter
    // "/photos/felix.jpg". You can also specify a URL.
    //
    // Example: "/photos/felix_highlight.jpg"
    photo: string;
    // Example: "I got to climb Mt Everest this year!"
    caption?: string;
    // If you want to position the caption at the top or bottom of the
    // image. "bottom" by default.
    captionPosition?: "top" | "bottom";
  };
}

export let CONFIG: Config = {} as any;

export async function loadConfig(configPath: string) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }

  const input = (await fs.readJSON(configPath, "utf-8")) as Config;
  const people = (input.people || []).map((person) => {
    return {
      ...person,
      from: person.from ? new Date(person.from) : undefined,
      to: person.to ? new Date(person.to) : undefined,
    };
  });

  return (CONFIG = {
    ...input,
    from: new Date(input.from),
    to: new Date(input.to),
    people,
    git: input.git,
    github: input.github
      ? {
          token: input.github.token || process.env.GITHUB_TOKEN || "",
          owner: input.github.owner || process.env.GITHUB_OWNER || "",
          repo: input.github.repo || process.env.GITHUB_REPO || "",
        }
      : undefined,
    slack: input.slack
      ? {
          token: process.env.SLACK_TOKEN || input.slack.token,
          channels: input.slack.channels || [],
          ignoreEmoji: input.slack.ignoreEmoji || [],
        }
      : undefined,
  });
}
