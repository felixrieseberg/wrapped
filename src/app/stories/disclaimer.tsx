import { Homemade_Apple } from "next/font/google";

import { StoryFunc } from "../../interfaces";

const homemadeApple = Homemade_Apple({ subsets: ["latin"], weight: "400" });

const DisclaimerStory: StoryFunc = (data, config) => {
  return [
    {
      content: (props) => (
        <div className="text-#fff text-center w-full h-full flex flex-col place-items-center justify-center bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-slate-900 via-zinc-800 to-gray-900">
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-25 brightness-100 contrast-150"></div>
          <p className={`${homemadeApple.className} text-3xl`}>
            fun only please
          </p>
          <br />
          <p className="w-3/4">
            We&apos;re taking a relaxed look back, not doing a performance
            review. Not all work is represented and nothing here should be
            confused with a measure of impact.{" "}
          </p>
        </div>
      ),
    },
  ];
};

export default DisclaimerStory;
