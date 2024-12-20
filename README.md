# Wrapped

This is a silly little weekend project creating a "Wrapped" for my engineering team.
It's fully configurable, meaning that you too can create a "Wrapped" for your team.

## Setup

First, clone this entire repository and install dependencies:

```
git clone https://github.com/felixrieseberg/wrapped
cd wrapped
npm i
```

### 1. Configuration

Then, create a configuration file `config.json` and place it in the root of the repo.
You can find a detailed description of the schema in [`config.ts`](data/config.ts).
Below is an example file.

<details>
<summary>Example for a `config.json`</summary>

```json
{
  "teamName": "Web Infra",
  "from": "2023-02-01",
  "to": "2024-02-01",
  "periodName": "fiscal year 2023",
  "people": [
    {
      "name": "Big Bird",
      "github": "bigbird",
      "highlight": {
        "photo": "/data/bigbird_highlight.jpg"
      }
    },
    {
      "name": "Cookie Monster",
      "github": "cookiemonster",
      "new": true,
      "photo": "/data/cookie.jpg",
      "highlight": {
        "photo": "/data/cookie_highlight.jpg",
        "caption": "I got to enjoy a bunch of cookies during my vacation in Hawaii!",
        "captionPosition": "top"
      }
    },
    {
      "name": "Count von Count",
      "github": "countvcount",
      "new": true,
      "photo": "/data/count.jpg",
      "highlight": {
        "photo": "/data/count_highlight.jpg",
        "caption": "Here's a picture of me at Glacier national park during road trip to Chicago!"
      }
    },
    {
      "name": "Elmo",
      "github": "elmo",
      "to": "2023-07-01"
    },
    {
      "name": "Bert",
      "github": "bert",
      "excludeFromLeaderboard": true
    }
  ],
  "highlights": [
    {
      "photo": "/data/team_highlight.jpg",
      "caption": "We had fun at the team offsite!",
      "captionPosition": "top"
    }
  ],
  "git": {
    "repoPath": "/Users/felix/code/notion-next",
    "folders": [
      "src/desktop"
    ]
  },
  "github": {
    "token": "ghp_12345678...",
    "owner": "makenotion",
    "repo": "notion-next"
  },
  "slack": {
    "token": "xoxp-123456...",
    "channels": [
      "eng-team-web-infra",
      "eng-team-web-infra-triage"
    ],
    "ignoreEmoji": [
      "github",
      "link",
      "v"
    ]
  },
  "projects": ["My cool project A", "My cool project B"]
}

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

### 4. Deployment

Before deploying, I suggest removing the tokens from the config file.

### License

All code is MIT. Images in `/public/backgrounds/` are from [Notion's Digital Drop](https://ntn.so/digitaldrop) and are (C) Copyright Notion Labs, Inc.
