import path from "path";
import fs from "fs-extra";
import * as url from "url";

import { Command, Option } from "commander";
import { create } from "./commands/create.js";
import { CommonOptions } from "../interfaces.js";
import { loadData } from "./storage.js";
import { getInPath } from "../helpers/in-path.js";
import { CONFIG, loadConfig } from "./config.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const packageJson = fs.readJSONSync(
  path.resolve(__dirname, "../../package.json"),
);
const program = new Command();

const COMMON_DEFAULTS: Partial<CommonOptions> = {
  config: getInPath("config.json"),
};

const configOption = new Option(
  "-c, --config <path>",
  "path to config file",
).default(COMMON_DEFAULTS.config);

program.name("wrapped").version(packageJson.version);

program
  .command("create")
  .description("Create a 'Notion Wrapped'")
  .addOption(configOption)
  .option("--skip-git", "Skip fetching git data")
  .option("--skip-github", "Skip fetching GitHub data")
  .option("--skip-slack", "Skip fetching Slack data")
  .option("--skip-fetch", "Skip fetching data if possible")
  .action(async (options) => {
    await loadConfig(options.config);
    await loadData();
    await create({
      skipGit: options.skipGit,
      skipGitHub: options.skipGithub,
      skipSlack: options.skipSlack,
      skipFetch: options.skipFetch,
    });
  });

program.parse();
