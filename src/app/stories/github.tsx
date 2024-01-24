import Image from "next/image";
import { Story } from "react-insta-stories/dist/interfaces";
import { Homemade_Apple, Rubik_Glitch, VT323 } from "next/font/google";

import { StoryFunc } from "../../interfaces";
import { formatNumber as n } from "../../helpers/format";
import {
  findClosestNumberComparison,
  WORDS_FOR_FAMOUS_BOOKS,
} from "../helpers/comparisons";
import { joined, theyAlso } from "../helpers/joined";

const homemadeApple = Homemade_Apple({ subsets: ["latin"], weight: "400" });
const rubikGlitch = Rubik_Glitch({ subsets: ["latin"], weight: "400" });
const vt323 = VT323({ subsets: ["latin"], weight: "400" });

const GitHubStories: StoryFunc = (data, config) => {
  const stories: Story[] = [
    ...TeamCreation(data, config),
    ...TopChanges(data, config),
    ...TopWriter(data, config),
    ...TopFilesCommits(data, config),
    ...TopReviewer(data, config),
    ...TopTester(data, config),
  ];

  return stories;
};

const TeamCreation: StoryFunc = (data, config) => {
  const { teamTotals } = data;
  const additionComparison = findClosestNumberComparison(
    teamTotals.github?.additions || 0,
  );

  return [
    {
      content: (props) => (
        <div className="bg-notion-paper w-full h-full flex place-items-center justify-center">
          <div className="w-3/4 text-center text-black">
            <p>{`Together, ${config.teamName} hit the keyboard hard.`}</p>
            <div className="bg-black p-4 mt-[50px] text-white rounded-md drop-shadow-md -rotate-[4deg]">
              <p
                className={`${vt323.className} text-green-200 text-2xl`}
              >{`+ ${n(teamTotals.github?.additions || 0)} additions`}</p>
              <p
                className={`${vt323.className} text-red-200 text-2xl`}
              >{`- ${n(teamTotals.github?.deletions || 0)} deletions`}</p>
              <p className="mt-[10px]">
                All up, we made {teamTotals.github?.pulls} pull requests!
              </p>
            </div>
            <Image
              src="/backgrounds/coffee.png"
              width={320}
              height={217}
              alt="Coffee mugs"
            />
            <div className="mt-5">
              <p>
                By the way, the {additionComparison.name} project has{" "}
                {n(additionComparison.count)} lines of code.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];
};

const TopChanges: StoryFunc = (data, config) => {
  const leaders = data.teamLeaders.github;

  if (!leaders) return [];

  const { additions, deletions } = leaders;
  const topAdder = joined(additions.names);
  const topDeleter = theyAlso(additions.names, deletions.names);

  const additionComparison = findClosestNumberComparison(additions.value);
  const deletionComparison = findClosestNumberComparison(deletions.value);

  return [
    {
      duration: 12000,
      content: (props) => (
        <div className="bg-gradient-to-bl from-red-600 via-neutral-700 to-green-500 text-center w-full h-full p-8 bg-cover pt-20">
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-25 brightness-100 contrast-150"></div>
          <p className={`text-6xl ${vt323.className}`}>∑ git diff ±</p>
          <p className="mt-[50px]">
            {topAdder} added the most code - a whopping{" "}
            <span className="text-green-400 font-bold drop-shadow-md">
              {nv(additions)}
            </span>{" "}
            lines. That is roughly equivalent to {additionComparison.name},
            which has {n(additionComparison.count)} lines of code!
          </p>

          <div className="mt-[50px]">
            <p>
              {topDeleter} deleted, overwrote, and cut out the most code -
              <span className="text-red-400 font-bold drop-shadow-md">
                {" "}
                {nv(deletions)}
              </span>{" "}
              lines. They could have also deleted {deletionComparison.name} and
              its {n(deletionComparison.count)} lines.
            </p>
          </div>
        </div>
      ),
    },
  ];
};

const TopFilesCommits: StoryFunc = (data, config) => {
  if (!data.teamLeaders.github) return [];

  const { changedFiles, commits } = data.teamLeaders.github;
  const fileChanger = joined(changedFiles.names);
  const committer = joined(commits.names);

  return [
    {
      content: (props) => (
        <div className="bg-notion-paper bg-cover w-full h-full flex place-items-center justify-center">
          <div className="w-3/4 text-center text-black">
            <p>
              <span className="font-semibold">{fileChanger}</span> changed the
              most files (in total, {nv(changedFiles)}).
            </p>
            <Image
              className="mt-10"
              src="/backgrounds/postit.png"
              width={300}
              height={284}
              alt="Postits"
            />
            <p className="mt-10">
              With {nv(commits)} commits,{" "}
              <span className="font-semibold">{committer}</span> pushed the most
              of us on {config.teamName}.
            </p>
          </div>
        </div>
      ),
    },
  ];
};

const TopWriter: StoryFunc = (data, config) => {
  const { teamTotals } = data;
  const leaders = data.teamLeaders.github;
  const totals = data.teamTotals.github;

  if (!leaders || !totals) return [];

  const totalWords = n(teamTotals.github?.wordsInPullBodies);
  const writer = joined(leaders.wordsInPullBodies.names);
  const writerWords = nv(leaders.wordsInPullBodies);
  const avgWriter = joined(leaders.wordsPerPullAvg.names);
  const avgWriterWords = nv(leaders.wordsPerPullAvg);

  const totalComparison = findClosestNumberComparison(
    teamTotals.github!.wordsInPullBodies,
    WORDS_FOR_FAMOUS_BOOKS,
  );

  const writerComparison = findClosestNumberComparison(
    leaders.wordsInPullBodies.value,
    WORDS_FOR_FAMOUS_BOOKS,
  );

  return [
    {
      duration: 12000,
      content: (props) => (
        <div className="text-black text-center w-full h-full p-8 bg-cover bg-notion-paper pt-20 flex flex-col flex-auto">
          <p className={`${homemadeApple.className} text-2xl`}>
            We are thinkers,
            <br />
            we are writers
          </p>
          <p className="mt-[30px]">
            Together, {config.teamName}&rsquo;s PR descriptions contained{" "}
            {totalWords} words. {totalComparison.name} has{" "}
            {n(totalComparison.count)} words.
          </p>
          <div className="shrink grow relative">
            <Image
              className="mt-5 mx-auto shrink w-full h-auto"
              src="/backgrounds/think.png"
              objectFit="contain"
              fill={true}
              alt="Think"
            />
          </div>
          <p className="mt-10">
            <span className="font-semibold">{writer}</span> is our{" "}
            <span>top writer</span> and poured {writerWords} words into their
            PRs - about as much as {writerComparison.name} with{" "}
            {n(writerComparison.count)} words.{" "}
            <span className="font-semibold">{avgWriter}</span> is diligent and
            writes the most on average ({avgWriterWords} words).
          </p>
        </div>
      ),
    },
  ];
};

const TopReviewer: StoryFunc = (data, config) => {
  const { teamTotals } = data;
  const leaders = data.teamLeaders.github;

  if (!leaders) return [];

  const reviewer = joined(leaders.pullsReviewed.names);
  const commenter = theyAlso(
    leaders.pullsReviewed.names,
    leaders.pullsCommentedOn.names,
  );

  return [
    {
      duration: 9000,
      content: (props) => (
        <div className="text-black text-center w-full h-full p-8 bg-cover bg-notion-paper pt-20">
          <p className={`${homemadeApple.className} text-2xl`}>
            A thank you for all the reviews you&apos;ve done.
          </p>
          <p className="mt-[30px]">
            {config.teamName} reviewed {n(teamTotals.github?.pullsReviewed)}{" "}
            unique PRs.
          </p>
          <Image
            className="mt-10"
            src="/backgrounds/peace.png"
            width={320}
            height={192}
            alt="Think"
          />
          <p className="mt-10">
            <span className="font-bold">{reviewer}</span> is our{" "}
            <span>top reviewer</span> and deserves special thanks - they
            supported {nv(leaders.pullsReviewed)} PRs! {commenter}{" "}
            <span className="font-semibold">commented</span> on the most unique
            PRs ({nv(leaders.pullsCommentedOn)} in total).
          </p>
        </div>
      ),
    },
  ];
};

const TopTester: StoryFunc = (data, config) => {
  const leaders = data.teamLeaders.github;
  const totals = data.teamTotals.github;

  if (!leaders || !totals) return [];

  const {
    pullsTestedManually,
    pullsTestedBrowser,
    pullsTestedClient,
    pullsTestedIntegration,
  } = totals;
  const browserLeader = joined(leaders.pullsTestedBrowser.names);
  const clientLeader = joined(leaders.pullsTestedClient.names);
  const integrationLeader = joined(leaders.pullsTestedIntegration.names);
  const manualLeader = joined(leaders.pullsTestedManually.names);

  return [
    {
      duration: 6000,
      content: (props) => (
        <div className="bg-[conic-gradient(at_top_right,var(--tw-gradient-stops))] from-black via-gray-800 to-white text-center w-full h-full p-8 bg-cover pt-20">
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-25 brightness-100 contrast-150"></div>
          <p className={`${rubikGlitch.className} text-8xl`}>TESTNIG</p>
          <p className="mt-[30px]">
            As a team, {config.teamName} tested {pullsTestedManually} PRs
            manually, {pullsTestedBrowser} with browser tests,{" "}
            {pullsTestedClient} with client tests, and {pullsTestedIntegration}{" "}
            with integration tests.
          </p>
          <p className="mt-[150px]">
            Here are your leaders for testing the most PRs using each category:
          </p>
          <div className="bg-white p-4 mt-[50px] text-black rounded-md drop-shadow-md rotate-6">
            <p>
              <span className="font-bold uppercase">Manually</span>:{" "}
              {manualLeader}
            </p>
            <p>
              <span className="font-bold uppercase">Browser</span>:{" "}
              {browserLeader}
            </p>
            <p>
              <span className="font-bold uppercase">Client</span>:{" "}
              {clientLeader}
            </p>
            <p>
              <span className="font-bold uppercase">Integration</span>:{" "}
              {integrationLeader}
            </p>
          </div>
        </div>
      ),
    },
  ];
};

function nv(input: { value: number }): string {
  return n(input.value);
}

export default GitHubStories;
