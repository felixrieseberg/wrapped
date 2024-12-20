import { Story } from "react-insta-stories/dist/interfaces";
import { VT323 } from "next/font/google";

import { StoryFunc } from "../../interfaces";
const vt323 = VT323({ subsets: ["latin"], weight: "400" });


const GitStories: StoryFunc = (data, config) => {
  const stories: Story[] = [];
  const folders = Object.keys(data.git?.folders || {});

  if (data.git) {
    stories.push(...GitLogStories(data, config));
  }

  if (folders.length > 0) {
    // Add per-folder stories
  }

  return stories;
};

const GitLogStories: StoryFunc = (data, config) => {
  const git = data.git!;

  const coAuthoredCount = git.commitStats?.coAuthoredCount;
  const coAuthorPairs = git.commitStats?.coAuthorPairs || [];
  const topPair = Object.entries(coAuthorPairs).sort((a, b) => b[1] - a[1])[0];

  return [
    {
      duration: 12000,
      content: (props) => (
        <div className="bg-gradient-to-bl from-red-600 via-neutral-700 to-green-500 text-center w-full h-full p-8 bg-cover pt-20">
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-25 brightness-100 contrast-150"></div>
          <p className={`text-6xl ${vt323.className}`}>git log</p>
          <p className="mt-[50px]">
            {`Synergies! ${coAuthoredCount} of our "main" commits were co-authored by someone. ${topPair[0]} co-authored the most with ${topPair[1]} commits.`}
          </p>
        </div>
      ),
    },
  ];
};

export default GitStories;
