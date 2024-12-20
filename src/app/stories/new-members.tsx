import Image from "next/image";

import { StoryFunc } from "../../interfaces";
import { Homemade_Apple, Rubik_Glitch, VT323 } from "next/font/google";
import { joined } from "../helpers/joined";

const homemadeApple = Homemade_Apple({ subsets: ["latin"], weight: "400" });

const NewMembersStory: StoryFunc = (data, config) => {
  const newPeople = config.people.filter((p) => p.new);
  const newPeopleNames = joined(newPeople.map((p) => p.name));

  const newPeopleImages = newPeople
    .filter((p) => !!p.photo)
    .map((p) => {
      return (
        <div key={p.name}>
          <div className="rounded-full overflow-hidden border-4 w-[124px] h-[124px] border-black">
            <Image
              src={p.photo!}
              alt={`Photo of ${p.name}`}
              className="object-cover w-full h-full"
              width={200}
              height={200}
            />
          </div>
          <p
            className={`-mt-[10px] bg-white z-10 pt-[5px] relative ${homemadeApple.className}`}
          >
            {p.name.split(" ")[0]}
          </p>
        </div>
      );
    });

  return [
    {
      duration: 12000,
      content: (props) => (
        <div className="bg-notion-orange bg-cover w-full h-full flex place-items-center justify-center content-center">
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-25 brightness-100 contrast-150"></div>
          <div className="w-full text-center text-black">
            <p className={`${homemadeApple.className}`}>
              <span className="text-7xl">Welcome,</span>
              <br />
              <span className="text-5xl">{newPeopleNames}!</span>
            </p>
            <p className="mt-5">
              Proudly presenting
              <br />
              the newest members of {config.teamName}.<br />
              We&apos;re so happy you&apos;re here!
            </p>
            <div className="mt-5 relative w-full overflow-hidden">
              <div className="flex flex-row gap-5 animate-[scroll_10s_linear_infinite] whitespace-nowrap">
                {newPeopleImages}
                {newPeopleImages}
              </div>
              <style jsx>{`
                @keyframes scroll {
                  0% {
                    transform: translateX(0);
                  }
                  100% {
                    transform: translateX(-50%);
                  }
                }
              `}</style>
            </div>
          </div>
        </div>
      ),
    },
  ];
};

export default NewMembersStory;
