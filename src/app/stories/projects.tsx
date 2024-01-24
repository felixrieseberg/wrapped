import { StoryFunc } from "../../interfaces";
import { Homemade_Apple } from "next/font/google";
import ScrollingText from "../components/scrolling-text";

const homemadeApple = Homemade_Apple({ subsets: ["latin"], weight: "400" });

const ProjectsStory: StoryFunc = (data, config) => {
  if (!config.projects) {
    return [];
  }

  return [
    {
      duration: 3000,
      content: (props) => (
        <div className="bg-notion-paper bg-cover w-full h-full flex flex-col justify-center place-items-center">
          <div className="z-10 bg-black p-4 mt-[50%] text-white text-center rounded-md drop-shadow-md">
            <p>
              You have shipped <i>so much</i>.
            </p>
            <p className={`${homemadeApple.className} text-xl mt-1`}>
              Thank you.
            </p>
          </div>
          <ScrollingText strings={config.projects!} />
        </div>
      ),
    },
  ];
};

export default ProjectsStory;
