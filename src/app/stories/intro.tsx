import { StoryFunc } from "../../interfaces";
import { Homemade_Apple, Rubik_Glitch, VT323 } from "next/font/google";

const homemadeApple = Homemade_Apple({ subsets: ["latin"], weight: "400" });

const StoryIntro: StoryFunc = (data, config) => {
  return [
    {
      duration: 3000,
      content: (props) => (
        <div className="bg-[url('/backgrounds/lofi.png')] bg-cover w-full h-full flex place-items-center">
          <div
            className="w-full text-center text-black"
            style={{ marginBottom: 200 }}
          >
            <p>Welcome to</p>
            <p className="">~ {config.periodName} ~</p>
            <p className={`${homemadeApple.className} font-bold text-4xl`}>
              wrapped
            </p>
            <p style={{ marginTop: 50 }}>{`for ${config.teamName}`}</p>
          </div>
        </div>
      ),
    },
  ];
};

export default StoryIntro;
