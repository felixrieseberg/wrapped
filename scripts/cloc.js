import { promisify } from "util";
import child_process from "child_process";
import fs from "fs-extra";

const exec = promisify(child_process.exec);

const projects = [
  "vercel/next.js",
  "facebook/react-native",
  "kubernetes/kubernetes",
  "nodejs/node",
  "microsoft/TypeScript",
  "angular/angular",
  "apache/spark",
  "puppeteer/puppeteer",
  "sveltejs/svelte",
  "bitcoin/bitcoin",
  "apple/swift",
  "redis/redis",
  "twitter/the-algorithm",
  "vitejs/vite",
  "reduxjs/redux",
  "jquery/jquery",
  "lodash/lodash",
  "rails/rails",
  "expressjs/express",
  "vuejs/vue",
  "grafana/grafana",
  "facebookresearch/llama",
];

async function main() {
  const results = [];

  for (const project of projects) {
    const foldername = sanitizeFolderName(repo);

    try {
      await clone(repo, foldername);
      const sloc = await cloc(foldername);
      await fs.remove(foldername);

      results.push({ project, sloc });
      await fs.writeJSON("results.json", results);
    } catch (error) {
      console.log(`Error processing ${repo}: ${error.message}`);
    }
  }

  console.log(results);
}

async function cloc(foldername) {
  console.log(`Counting lines of code for ${foldername}`);
  const { stdout, stderr } = await exec(`cloc ${foldername} --json`);
  const parsed = JSON.parse(stdout);

  return parsed.SUM.code;
}

async function clone(repo, folderName) {
  console.log(`Cloning ${repo}`);
  await exec(`git clone --depth 1 https://github.com/${repo} ${folderName}`);
}

function sanitizeFolderName(inputString) {
  // Replace invalid characters with underscores
  const sanitizedString = inputString.replace(/[/\\?%*:|"<>]/g, "_");

  // Remove leading and trailing whitespaces
  const trimmedString = sanitizedString.trim();

  // Ensure the folder name is not empty after sanitization
  if (trimmedString.length === 0) {
    return Date.now();
  }

  return trimmedString;
}

main();
