import Image from "next/image";
import { Story } from "react-insta-stories/dist/interfaces";

import { StoryFunc } from "../../interfaces";
import { Homemade_Apple } from "next/font/google";

import "./highlights.css";
import { joined } from "../helpers/joined";

const homemadeApple = Homemade_Apple({ subsets: ["latin"], weight: "400" });

const HighlightStories: StoryFunc = (data, config) => {
  const peopleWithHighlights = config.people.filter((p) => p.highlight);
  let stories: Story[] = [];

  for (const person of peopleWithHighlights) {
    const backgroundImage = `url(${person.highlight!.photo})`;

    const firstName = person.name.split(" ")[0];
    const captionText = person.highlight!.caption
      ? `${firstName}: ${person.highlight!.caption}`
      : firstName;
    const captionPosition =
      person.highlight!.captionPosition === "top" ? "top-10" : "bottom-10";

    stories.push({
      content: (props) => (
        <div className="w-full h-full">
          <div
            style={{ backgroundImage }}
            className="ken-burns-bg bg-cover w-full h-full flex place-items-center justify-center content-center"
          />
          <div className={`w-full absolute ${captionPosition}`}>
            <div className="bg-black text-white w-1/2 mx-auto p-1 pt-1.5 text-xs text-center rounded-md select-none">
              {captionText}
            </div>
          </div>
        </div>
      ),
    });
  }

  for (const highlight of config.highlights || []) {
    const backgroundImage = `url(${highlight.photo})`;
    const captionPosition = highlight.captionPosition === "top" ? "top-10" : "bottom-10";

    const caption = highlight.caption ? <div className="bg-black text-white w-1/2 mx-auto p-1 pt-1.5 text-xs text-center rounded-md select-none">
    {highlight.caption}
  </div> : null;

    stories.push({
      content: (props) => (
        <div className="w-full h-full">
          <div
            style={{ backgroundImage }}
            className="ken-burns-bg bg-cover w-full h-full flex place-items-center justify-center content-center"
          />
          <div className={`w-full absolute ${captionPosition}`}>
            {caption}
          </div>
        </div>
      ),
    });
  }

  if (stories.length > 0) {
    const firstNames = joined(
      config.people.filter((p) => !p.to).map((p) => p.name.split(" ")[0]),
    );

    stories.unshift({
      duration: 120000,
      content: (props) => (
        <div className="text-black text-center w-full h-full p-8 bg-cover bg-notion-paper pt-20 flex flex-col flex-auto">
          <p className={`${homemadeApple.className} text-8xl mb-10 mt-10`}>
            Thank You
          </p>
          <div className="shrink grow relative">
            <Image
              src="/backgrounds/peace.png"
              objectFit="contain"
              fill={true}
              alt="Think"
            />
          </div>
          <p className="mt-16">
            To close things out, a few highlights from all of us on{" "}
            {config.teamName} today - {firstNames}.
          </p>
        </div>
      ),
    });
  }

  return stories;
};

export default HighlightStories;
