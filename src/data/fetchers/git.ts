import { exec } from "child_process";
import ora from "ora";
import { promisify } from "util";
import { CONFIG } from "../config.js";
import chalk from "chalk";
import { DATA, saveData } from "../storage.js";
import { formatNumber } from "../../helpers/format.js";
import { outputMiniTable } from "../../helpers/table.js";

const execPromise = promisify(exec);

export async function fetchGit() {
  await fetchChangesInFolders();
}

async function fetchChangesInFolders() {
  if (!CONFIG.git) {
    console.log(
      chalk.bold(`Skipping git analysis because it's not configured`),
    );
    return;
  }

  console.log(chalk.bold(`\nRepo Changes`));

  for (const folder of CONFIG.git.folders) {
    const linesChanged = await getChangesInFolder(folder);
    const commits = await getCommitsAtTheEnds();

    DATA.git[folder] = {
      linesChanged,
      commitAtFrom: commits.commitAtFrom,
      commitAtTo: commits.commitAtTo,
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
