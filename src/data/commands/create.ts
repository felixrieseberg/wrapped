import chalk from "chalk";

import { fetchGit } from "../fetchers/git.js";
import { fetchGitHub } from "../fetchers/github.js";
import { getDataPath } from "../../helpers/data-path.js";
import { CONFIG } from "../config.js";
import { saveData } from "../storage.js";
import { fetchSlack } from "../fetchers/slack.js";

export interface CreateOptions {
  skipGit: boolean;
  skipGitHub: boolean;
  skipSlack: boolean;
  skipFetch: boolean;
}

export async function create(options: CreateOptions) {
  console.log(
    chalk.bold.inverse(
      `
As we all know, data like "lines of code" and "pull requests"
should never be used to measure impact. A single character
change in the right place can make or save millions of dollars
while any number of pull requests can doom an entire company.

If you're using this tool, you have to promise me (Felix) that
you will not use this data to measure impact, performance, or
productivity. It is meant to be fun. Treat it as fun.

Thank you.
  `.trim(),
      "\n",
    ),
  );

  if (!options.skipSlack) {
    await fetchSlack({
      skipFetch: options.skipFetch,
    });
  }

  if (!options.skipGitHub) {
    await fetchGitHub();
  }

  if (!options.skipGit) {
    await fetchGit();
  }

  await saveData({ updateTimestap: true });

  console.log(`\nSaved data to ${getDataPath(CONFIG)}`);
}
