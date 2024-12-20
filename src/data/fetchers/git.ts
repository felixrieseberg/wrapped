import { exec } from "child_process";
import ora, { Ora } from "ora";
import { promisify } from "util";
import { CONFIG, Person } from "../config.js";
import chalk from "chalk";
import { DATA, saveData } from "../storage.js";
import { formatNumber } from "../../helpers/format.js";
import { outputMiniTable } from "../../helpers/table.js";

const execPromise = promisify(exec);

export async function fetchGit() {
  await fetchRepoData();
  await fetchChangesInFolders();
}

async function fetchRepoData() {
  if (!CONFIG.git) {
    console.log(chalk.bold(`Skipping git analysis because it's not configured`));
    return;
  }
  
  const { commitAtFrom, commitAtTo } = await getCommitsAtTheEnds();

  DATA.git = DATA.git || {};
  DATA.git.commitAtFrom = commitAtFrom;
  DATA.git.commitAtTo = commitAtTo;

  DATA.git.activityStats = await getActivityStats();
  DATA.git.commitStats = await getCommitStats();

  saveData();
}

async function fetchChangesInFolders() {
  if (!CONFIG.git) {
    console.log(
      chalk.bold(`Skipping git analysis because it's not configured`),
    );
    return;
  }

  console.log(chalk.bold(`\nRepo Changes`));

  DATA.git = DATA.git || {};
  DATA.git.folders = DATA.git.folders || {};

  for (const folder of CONFIG.git.folders) {
    const linesChanged = await getChangesInFolder(folder);
    const fileStats = await getFileStats(folder);

    DATA.git.folders[folder] = {
      linesChanged,
      files: fileStats,
    };

    saveData();
  }
}

async function getCommitsAtTheEnds() {
  const startDate = CONFIG.from.toISOString().split("T")[0];
  const endDate = CONFIG.to.toISOString().split("T")[0];
  const spinner = ora(`Getting commits for start and end`).start();
  const rows: string[][] = [];

  for (const dt of [startDate, endDate]) {
    const cmd = `git log --oneline --before ${dt} -1`;
    const { stdout } = await execPromise(cmd, {
      cwd: CONFIG.git?.repoPath,
    });
    const commit = stdout.trim().split(" ")[0];

    rows.push([dt, commit]);
  }
  spinner.succeed("Got commits for the dates:");

  outputMiniTable(rows);

  return {
    commitAtFrom: rows[0][1],
    commitAtTo: rows[1][1],
  };
}

async function getChangesInFolder(folder: string) {
  const spinner = ora(`Fetching line changes in ${folder}`).start();
  const gitCmd = `git log --numstat --pretty=format:"" -- ${folder}`;
  const awkCmd = `awk 'NF==3 {plus+=$1; minus+=$2} END {print plus+minus}'`;
  const cmd = `${gitCmd} | ${awkCmd}`;
  const result = await getGitNumber(cmd);

  spinner.succeed(`Line changes in folder ${folder}: ${formatNumber(result)}`);

  return result;
}

async function getGitNumber(cmd: string) {
  return parseInt(await getGit(cmd), 10);
}

async function getGit(cmd: string) {
  const startDate = CONFIG.from.toISOString().split("T")[0];
  const endDate = CONFIG.to.toISOString().split("T")[0];
  const gitCmd = cmd.replace(
    `git log`,
    `git log --since="${startDate}" --until="${endDate}"`,
  );

  const { stdout } = await execPromise(gitCmd, {
    cwd: CONFIG.git?.repoPath,
  });

  return stdout.trim();
}

async function getActivityStats() {
  const spinner = ora(`Analyzing activity patterns`).start();
  const authors = getAuthorFilter(CONFIG.people);

  // Most active hour
  const hourCmd = `git log ${authors} --format="%ai" | cut -c 12-13 | sort -n | uniq -c | sort -rn | head -n 1`;
  const { stdout: hourResult } = await execPromise(hourCmd, {
    cwd: CONFIG.git?.repoPath,
  });
  const [count, hour] = hourResult.trim().split(/\s+/);
  
  // Most active day
  const dayCmd = `git log ${authors} --format="%ad" --date=format:"%A" | sort | uniq -c | sort -rn | head -n 1`;
  const { stdout: dayResult } = await execPromise(dayCmd, {
    cwd: CONFIG.git?.repoPath,
  });
  const [dayCount, day] = dayResult.trim().split(/\s+/);

  spinner.succeed(`Found activity patterns`);
  
  return {
    mostActiveHour: {
      hour: parseInt(hour),
      commits: parseInt(count),
    },
    mostActiveDay: {
      day,
      commits: parseInt(dayCount),
    },
  };
}

async function getCommitStats() {
  const spinner = ora(`Analyzing commit patterns`).start();
  const authors = getAuthorFilter(CONFIG.people);
  
  // Average commit message length
  const msgLengthCmd = `git log ${authors} --pretty=format:"%s" | awk '{ sum += length; n++ } END { print sum/n }'`;
  const { stdout: avgLength } = await execPromise(msgLengthCmd, {
    cwd: CONFIG.git?.repoPath,
  });

  const result = {
    averageMessageLength: Math.round(parseFloat(avgLength)),
    ...await getCoAuthors(spinner),
  };

  spinner.succeed(`Analyzed commit patterns`);

  return result;
}

async function getCoAuthors(spinner: Ora) {
  const getPairName = (name1: string, name2: string) => {
    const [a, b] = [name1, name2].sort();
    return `${a} and ${b}`;
  }

  const coAuthorPairs: Record<string, number> = {};
  let coAuthoredCount = 0

  for (const person of CONFIG.people) {
    spinner.text = `Analyzing co-authors for ${person.name}`;

    const cmd = `
      git log --author=".*${person.name}.*" --pretty=format:":::%an:::%b" |
        grep "Co-authored-by:" |
        sed 's/:::/ /g' |
        awk -F 'Co-authored-by:' '{print $2}' |
        sed -E 's/^[[:space:]]*([^<]*)<.*$/\\1/' |
        sed 's/[[:space:]]*$//'
    `.trim();

    const { stdout } = await execPromise(cmd, {
      cwd: CONFIG.git?.repoPath,
    });

    const lines = stdout.trim().split('\n');

    for (const line of lines) {
      const coAuthor = line.trim();

      if (coAuthor === person.name) continue;
      if (!coAuthor || !person.name) continue;

      coAuthoredCount++;
      const pairName = getPairName(person.name, coAuthor);
      coAuthorPairs[pairName] = (coAuthorPairs[pairName] || 0) + 1;
    }
  }

  return {
    coAuthoredCount,
    coAuthorPairs,
  };
}

async function getFileStats(folder: string) {
  const spinner = ora(`Analyzing file patterns in ${folder}`).start();
  const authors = getAuthorFilter(CONFIG.people);
  
  // Most modified file types
  const fileTypesCmd = `git log ${authors} --pretty=format: --name-only -- ${folder} | grep -v '^$' | awk -F. '{print $NF}' | sort | uniq -c | sort -rn | head -5`;
  const { stdout: fileTypes } = await execPromise(fileTypesCmd, {
    cwd: CONFIG.git?.repoPath,
  });

  // Parse file types into structured data
  const topFileTypes = fileTypes
    .trim()
    .split('\n')
    .map(line => {
      const [count, ext] = line.trim().split(/\s+/);
      return { extension: ext, count: parseInt(count) };
    });

  spinner.succeed(`Analyzed file patterns`);

  return {
    topFileTypes,
  };
}

function getAuthorFilter(people: Person[]) {
  const filter = CONFIG.people
    .filter(p => p.name)
    .map(p => `--author=".*${p.name}.*"`) // Use regex pattern to match name anywhere in author field
    .join(' ');

  return filter;
}
