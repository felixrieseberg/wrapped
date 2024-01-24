# Wrapped

This is a silly little weekend project creating a "Wrapped" for my engineering team.
It's fully configurable, meaning that you too can create a "Wrapped" for your team.

## Setup

First, clone this entire repository with `git clone https://github.com/felixrieseberg/wrapped`.

### 1. Configuration

Then, create a configuration file `config.json` and place it in the root of the repo.
You can find a detailed description of the schema in [`config.ts`](data/config.ts).
Below is an example file.

<details>
<summary>Example for a `config.json`</summary>

```json

```
</details>

### 2. Fetch Data
Then, fetch data with `npm run cli create`. The command takes a few CLI arguments:

 - `--skip-git`: Don't fetch `git` information
 - `--skit-github`: Don't fetch GitHub information
 - `--skip-slack`: Don't fetch Slack information
 - `--skip-fetch`: Will still run all the fetchers but instructs the fetchers to 
  avoid fetching new data if possible.

### 3. Create the Website

The website portion is a Next.js React app. You can find information about how to
deploy your website once built with https://nextjs.org/docs/pages/building-your-application/deploying.

You probably want to customize your `wrapped` a bit. It's all just React, so edit your
heart out!

The command line tools available are:

 - `npm run dev`: Build and run a local dev server
 - `npm run build`: Build an optimized production build
 - `npm run lint`: Run prettier

### License

All code is MIT. Images in `/public/backgrounds/` are from [Notion's Digital Drop](https://ntn.so/digitaldrop) and are (C) Copyright Notion Labs, Inc.
