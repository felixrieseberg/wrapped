import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import ora from "ora";
import chalk from "chalk";

import { CONFIG, Config, Person } from "../config.js";
import {
  GitHubLeaders,
  GitHubPullRequest,
  GitHubTestType,
  GitHubTotals,
  PullRequest,
  GitHubTeamTotals,
} from "../../interfaces.js";
import { DATA, getTotals, saveData } from "../storage.js";
import { calculateAverage } from "../../helpers/average.js";
import { calculateMedian } from "../../helpers/median.js";
import { formatNumber } from "../../helpers/format.js";
import { calculateWordsInString } from "../../helpers/calculate-words.js";
import { outputMiniTable } from "../../helpers/table.js";
import { sum } from "../../helpers/sum.js";
import { capitalize } from "../../helpers/capitalize.js";
import { isCurrent } from "../../helpers/is-current.js";
import { calculateImagesInString } from "../../helpers/calculate-images.js";

export async function fetchGitHub(): Promise<void> {
  if (!CONFIG.github) {
    console.log(
      chalk.bold("Skipping GitHub analysis because it's not configured"),
    );
    return;
  }

  const isDataCurrent = isCurrent(CONFIG, DATA.createdOn);

  for (const person of CONFIG.people) {
    if (!person.github) {
      console.log(`Skipping ${person.name} as no GitHub username was provided`);
    } else if (
      DATA.github[person.name] &&
      DATA.github[person.name].pullsAllFetched &&
      isDataCurrent
    ) {
      console.log(
        `Skipping ${person.name} as all pull requests have already been fetched`,
      );
    } else {
      await fetchAuthoredPullRequests(person);
      await fetchCommentedPullRequests(person);
      await fetchReviewedPullRequests(person);
    }
  }

  console.log("Done fetching GitHub data");

  calculateTotals();
  calculateTeamTotals();
  calculateLeaders();

  await saveData();

  printInformation();
}

async function fetchReviewedPullRequests(person: Person) {
  if (!CONFIG.github) {
    throw new Error("GitHub config not found");
  }

  const spinner = ora(`Fetching pull requests ${person.name} reviewed`).start();
  const pullsReviewed = await fetchPullRequests({
    owner: CONFIG.github.owner,
    repo: CONFIG.github.repo,
    reviewedBy: person.github,
    since: getGitHubDate(person.from || CONFIG.from),
    until: getGitHubDate(person.to || CONFIG.to),
  });

  for (const pull of pullsReviewed) {
    DATA.github[person.name].pullsReviewed[pull.number] = pull;
  }

  await saveData();
  spinner.succeed(
    `Fetched ${pullsReviewed.length} pull requests ${person.name} reviewed`,
  );
}

async function fetchCommentedPullRequests(person: Person) {
  if (!CONFIG.github) {
    throw new Error("GitHub config not found");
  }

  const spinner = ora(
    `Fetching pull requests ${person.name} commented on`,
  ).start();
  const pullsCommentedOn = await fetchPullRequests({
    owner: CONFIG.github.owner,
    repo: CONFIG.github.repo,
    commenter: person.github,
    since: getGitHubDate(person.from || CONFIG.from),
    until: getGitHubDate(person.to || CONFIG.to),
  });

  for (const pull of pullsCommentedOn) {
    DATA.github[person.name].pullsCommentedOn[pull.number] = pull;
  }

  await saveData();
  spinner.succeed(
    `Fetched ${pullsCommentedOn.length} pull requests ${person.name} commented on`,
  );
}

async function fetchAuthoredPullRequests(person: Person) {
  if (!CONFIG.github) {
    throw new Error("GitHub config not found");
  }

  const spinner = ora(`Fetching pull requests from ${person.name}`).start();
  const pulls = await fetchPullRequests({
    owner: CONFIG.github.owner,
    repo: CONFIG.github.repo,
    user: person.github,
    since: getGitHubDate(person.from || CONFIG.from),
    until: getGitHubDate(person.to || CONFIG.to),
    isMerged: true,
  });

  for (const [index, pull] of pulls.entries()) {
    spinner.text = `Fetching details for pull request ${pull.number} ${
      index + 1
    }/${pulls.length}`;
    if (!DATA.github[person.name].pulls[pull.number]) {
      const details = await fetchPullRequest({
        id: pull.number,
      });

      DATA.github[person.name].pulls[pull.number] = {
        title: pull.title,
        url: pull.html_url,
        additions: details.additions,
        deletions: details.deletions,
        changedFiles: details.changed_files,
        createdAt: new Date(pull.created_at),
        comments: details.comments + details.review_comments,
        commits: details.commits,
        number: pull.number,
        body: details.body || "",
        reactions: (details as any).reactions,
      };

      await saveData();
    }
  }

  DATA.github[person.name].pullsAllFetched = true;

  await saveData();
  spinner.succeed(`Fetched ${pulls.length} pull requests for ${person.name}`);
}

function calculateTotals() {
  for (const person of CONFIG.people) {
    const data = DATA.github[person.name];
    if (!data) {
      continue;
    }

    const pulls = Object.values(data.pulls);
    const pullsReviewed = Object.values(data.pullsReviewed);
    const pullsCommentedOn = Object.values(data.pullsCommentedOn);
    data.totals = getTotals();

    const { totals } = data;

    for (const pull of pulls) {
      totals.additions += pull.additions;
      totals.deletions += pull.deletions;
      totals.changedFiles += pull.changedFiles;
      totals.comments += pull.comments;
      totals.commits += pull.commits;
      totals.pulls.push(pull.number);
      totals.wordsInPullBodies.push(calculateWordsInString(pull.body));
      totals.imagesInPullBodies.push(calculateImagesInString(pull.body));

      const tests = getTestTypes(pull);
      if (tests.client) totals.pullsTestedClient.push(pull.number);
      if (tests.browser) totals.pullsTestedBrowser.push(pull.number);
      if (tests.manual) totals.pullsTestedManually.push(pull.number);
      if (tests.integration) totals.pullsTestedIntegration.push(pull.number);
    }

    for (const pull of pullsReviewed) {
      totals.pullsReviewed.push(pull.number);
    }

    for (const pull of pullsCommentedOn) {
      totals.pullsCommentedOn.push(pull.number);
    }

    totals.additionsPerPullAvg = calculateAverage(
      pulls.map((p) => p.additions),
    );
    totals.deletionsPerPullAvg = calculateAverage(
      pulls.map((p) => p.deletions),
    );
    totals.changedFilesPerPullAvg = calculateAverage(
      pulls.map((p) => p.changedFiles),
    );
    totals.wordsPerPullAvg = calculateAverage(totals.wordsInPullBodies);
    totals.imagesPerPullAvg = calculateAverage(totals.imagesInPullBodies);
  }
}

let _octokit: Octokit | undefined;
async function getOctokit() {
  if (_octokit) {
    return _octokit;
  }

  if (!CONFIG.github) {
    throw new Error("GitHub config not found");
  }

  const ThrottledOctokit = Octokit.plugin(throttling);

  return (_octokit = new ThrottledOctokit({
    auth: CONFIG.github.token,
    throttle: {
      onRateLimit: (retryAfter, options) => {
        console.log(
          `Request quota exhausted for request ${options.method} ${options.url}. Retrying after ${retryAfter} seconds!`,
        );

        return true;
      },
      onSecondaryRateLimit(retryAfter, options, octokit, retryCount) {
        console.log(
          `Secondary request quota exhausted for request ${options.method} ${options.url}. Retrying after ${retryAfter} seconds!`,
        );

        return true;
      },
    },
  }));
}

interface FetchPullRequestsArgs {
  owner: string;
  repo: string;
  user?: string;
  since?: string;
  until?: string;
  commenter?: string;
  reviewedBy?: string;
  isMerged?: boolean;
}

async function fetchPullRequests(args: FetchPullRequestsArgs) {
  const octokit = await getOctokit();
  const { since, until, user } = args;

  let created = "";
  if (since && !until) {
    created = `+created:>=${since}`;
  } else if (!since && until) {
    created = `+created:<=${until}`;
  } else if (since && until) {
    created = `+created:${since}..${until}`;
  }

  const commenter = args.commenter ? `+commenter:${args.commenter}` : "";
  const reviewedBy = args.reviewedBy ? `+reviewed-by:${args.reviewedBy}` : "";
  const repo = `+repo:${args.owner}/${args.repo}`;
  const author = user ? `+author:${user}` : "";
  const merged = args.isMerged ? "+is:merged" : "";
  const q = `type:pr${repo}${created}${author}${commenter}${reviewedBy}${merged}`;

  const iterator = octokit.paginate.iterator(
    octokit.rest.search.issuesAndPullRequests,
    {
      q,
      per_page: 100,
    },
  );

  const allPulls = [];

  // iterate through each response
  for await (const { data: pulls } of iterator) {
    allPulls.push(...pulls);
  }

  return allPulls as unknown as GitHubPullRequest[];
}

interface FetchPullRequestArgs {
  id: number;
}

async function fetchPullRequest(args: FetchPullRequestArgs) {
  if (!CONFIG.github) {
    throw new Error("GitHub config not found");
  }

  const octokit = await getOctokit();
  const result = await octokit.pulls.get({
    owner: CONFIG.github.owner,
    repo: CONFIG.github.repo,
    pull_number: args.id,
  });

  return result.data;
}

const PRETTY_TITLES: Record<
  keyof GitHubTeamTotals | keyof GitHubTotals,
  string
> = {
  additions: "+ lines (total)",
  deletions: "- lines (total)",
  changedFiles: "Files changed (total)",
  comments: "Comments on our PRs (total)",
  commits: "Commits in our PRs (total)",
  pulls: "PRs",
  pullsReviewed: "Unique PRs reviewed",
  pullsCommentedOn: "Unique PRs commented on",
  wordsInPullBodies: "Words in PR bodies (total)",
  wordsPerPullAvg: "Words in PR bodies (avg)",
  imagesInPullBodies: "Images in PR bodies (total)",
  imagesPerPullAvg: "Images in PR bodies (avg)",
  additionsPerPullAvg: "+ lines per PR (avg)",
  deletionsPerPullAvg: "- lines per PR (avg)",
  changedFilesPerPullAvg: "Files changed per PR (avg)",
  additionsPerPullMed: "+ lines per PR (med)",
  deletionsPerPullMed: "- lines per PR (med)",
  changedFilesPerPullMed: "Files changed per PR (med)",
  pullsTestedManually: "PRs tested manually",
  pullsTestedClient: "PRs tested on client",
  pullsTestedBrowser: "PRs tested in browser",
  pullsTestedIntegration: "PRs tested in integration",
};

async function calculateLeaders(): Promise<GitHubLeaders> {
  const leaders: GitHubLeaders = {
    additions: { names: [], value: 0 },
    deletions: { names: [], value: 0 },
    changedFiles: { names: [], value: 0 },
    comments: { names: [], value: 0 },
    commits: { names: [], value: 0 },
    pulls: { names: [], value: 0 },
    pullsReviewed: { names: [], value: 0 },
    wordsInPullBodies: { names: [], value: 0 },
    wordsPerPullAvg: { names: [], value: 0 },
    imagesInPullBodies: { names: [], value: 0 },
    imagesPerPullAvg: { names: [], value: 0 },
    pullsCommentedOn: { names: [], value: 0 },
    additionsPerPullAvg: { names: [], value: 0 },
    deletionsPerPullAvg: { names: [], value: 0 },
    changedFilesPerPullAvg: { names: [], value: 0 },
    pullsTestedManually: { names: [], value: 0 },
    pullsTestedClient: { names: [], value: 0 },
    pullsTestedBrowser: { names: [], value: 0 },
    pullsTestedIntegration: { names: [], value: 0 },
  };

  for (const person of CONFIG.people) {
    const personData = DATA.github[person.name];
    const personTotals = personData.totals;

    // Figure out the leaderboard stars for each category
    if (!person.excludeFromLeaderboard) {
      for (const key of Object.keys(leaders) as Array<keyof GitHubTotals>) {
        const value = personTotals[key];
        let count = 0;

        if (Array.isArray(value)) {
          if (key === "wordsInPullBodies") {
            count = sum(value);
          } else {
            count = value.length;
          }
        } else {
          count = value;
        }

        if (count > leaders[key].value) {
          leaders[key].value = count;
          leaders[key].names = [person.name];
        } else if (count === leaders[key].value) {
          leaders[key].names.push(person.name);
        }
      }
    }
  }

  DATA.teamLeaders.github = leaders;

  return leaders;
}

async function calculateTeamTotals(): Promise<GitHubTeamTotals> {
  const teamTotals: GitHubTeamTotals = {
    changedFiles: 0,
    comments: 0,
    commits: 0,
    pulls: 0,
    pullsReviewed: 0,
    wordsInPullBodies: 0,
    imagesInPullBodies: 0,
    pullsCommentedOn: 0,
    additions: 0,
    deletions: 0,
    additionsPerPullAvg: 0,
    additionsPerPullMed: 0,
    deletionsPerPullAvg: 0,
    deletionsPerPullMed: 0,
    changedFilesPerPullAvg: 0,
    changedFilesPerPullMed: 0,
    pullsTestedManually: 0,
    pullsTestedClient: 0,
    pullsTestedBrowser: 0,
    pullsTestedIntegration: 0,
  };

  const additionsPerPulls: Array<number> = [];
  const deletionsPerPulls: Array<number> = [];
  const changedFilesPerPulls: Array<number> = [];
  const teamPulls = new Set();
  const teamPullsReviewed = new Set();
  const teamPullsCommentedOn = new Set();

  // Figure out the totals
  for (const person of CONFIG.people) {
    const personData = DATA.github[person.name];
    const personTotals = personData.totals;

    teamTotals.additions += personTotals.additions;
    teamTotals.deletions += personTotals.deletions;
    teamTotals.changedFiles += personTotals.changedFiles;
    teamTotals.comments += personTotals.comments;
    teamTotals.commits += personTotals.commits;
    teamTotals.wordsInPullBodies += sum(personTotals.wordsInPullBodies);

    personTotals.pulls.forEach((p) => teamPulls.add(p));
    personTotals.pullsReviewed.forEach((p) => teamPullsReviewed.add(p));
    personTotals.pullsCommentedOn.forEach((p) => teamPullsCommentedOn.add(p));

    Object.values(personData.pulls).forEach((pull) => {
      additionsPerPulls.push(pull.additions);
      deletionsPerPulls.push(pull.deletions);
      changedFilesPerPulls.push(pull.changedFiles);
    });

    teamTotals.pullsTestedManually += personTotals.pullsTestedManually.length;
    teamTotals.pullsTestedClient += personTotals.pullsTestedClient.length;
    teamTotals.pullsTestedBrowser += personTotals.pullsTestedBrowser.length;
    teamTotals.pullsTestedIntegration +=
      personTotals.pullsTestedIntegration.length;
  }

  teamTotals.pulls = teamPulls.size;
  teamTotals.pullsReviewed = teamPullsReviewed.size;
  teamTotals.pullsCommentedOn = teamPullsCommentedOn.size;
  teamTotals.additionsPerPullAvg = calculateAverage(additionsPerPulls);
  teamTotals.deletionsPerPullAvg = calculateAverage(deletionsPerPulls);
  teamTotals.changedFilesPerPullAvg = calculateAverage(changedFilesPerPulls);
  teamTotals.additionsPerPullMed = calculateMedian(additionsPerPulls);
  teamTotals.deletionsPerPullMed = calculateMedian(deletionsPerPulls);
  teamTotals.changedFilesPerPullMed = calculateMedian(changedFilesPerPulls);

  DATA.teamTotals.github = teamTotals;

  return teamTotals;
}

function printInformation() {
  // Generate totals
  const teamTotals = DATA.teamTotals.github;
  const leaders = DATA.teamLeaders.github;

  if (!teamTotals || !leaders) {
    throw new Error("Team totals or leaders not calculated");
  }

  console.log(chalk.bold("\nGitHub Totals"));
  const totalsRows: string[][] = [];
  for (const key of Object.keys(teamTotals) as Array<keyof GitHubTeamTotals>) {
    totalsRows.push([PRETTY_TITLES[key], formatNumber(teamTotals[key])]);
  }
  outputMiniTable(totalsRows);

  console.log(chalk.bold("\nGitHub Category Leaders"));
  const categoryLeaderRows: string[][] = [];
  for (const key of Object.keys(leaders) as Array<keyof GitHubTotals>) {
    categoryLeaderRows.push([
      PRETTY_TITLES[key],
      leaders[key].names.join(", "),
      formatNumber(leaders[key].value),
    ]);
  }
  outputMiniTable(categoryLeaderRows);
}

function getGitHubDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function getTestTypes({ body }: PullRequest): GitHubTestType {
  // [ ] Unit test\r\n- [ ] Client test\r\n- [ ] Integration test\r\n-
  // [ ] Browser (end-to-end) test\r\n- [x] Manual test
  const result: GitHubTestType = {
    client: false,
    manual: false,
    integration: false,
    browser: false,
    unit: false,
  };

  for (const key of Object.keys(result) as Array<keyof GitHubTestType>) {
    if (body.includes(`[x] ${capitalize(key)}`)) {
      result[key] = true;
    }
  }

  return result;
}
