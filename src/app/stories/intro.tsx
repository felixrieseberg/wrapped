import Image from "next/image";
import { StoryFunc } from "../../interfaces";
import { Homemade_Apple } from "next/font/google";

const homemadeApple = Homemade_Apple({ subsets: ["latin"], weight: "400" });

const CoverStory: StoryFunc = (data, config) => {
  const createdOn = new Date(data.createdOn).toLocaleDateString();

  return [
    {
      duration: 3000,
      content: (props) => (
        <div className="bg-notion-paper bg-cover w-full h-full flex flex-col justify-center place-items-center">
          <div className="w-full text-center text-black">
            <p>Welcome to</p>
            <p className="">~ {config.periodName} ~</p>
            <p className={`${homemadeApple.className} font-bold text-4xl`}>
              wrapped
            </p>
            <p>{`for ${config.teamName}`}</p>
          </div>
          <Image
            className="mt-5"
            src="/backgrounds/lofi.png"
            width={300}
            height={341}
            alt="Lofi girl"
          />
          <div className="w-full mt-14 text-center text-black">
            <p>
              Wrapped on {createdOn} {window.innerWidth}
            </p>
          </div>
        </div>
      ),
    },
  ];
};

export default CoverStory;
