"use client";

import ReactInstaStories from "react-insta-stories";
import { useMediaQuery } from "react-responsive";

import CoverStory from "./intro";
import DisclaimerStory from "./disclaimer";
import ThankYou from "../components/thank-you";
import { DataLight } from "../../interfaces";
import { Config } from "../../data/config";
import GitHubStories from "./github";
import NewMembersStory from "./new-members";
import { useEffect, useState } from "react";
import SlackStories from "./slack";
import HighlightStories from "./highlights";
import OutroStory from "./outro";
import ProjectsStory from "./projects";

export interface StoriesProps {
  data: DataLight;
  config: Config;
}

export default function Stories({ data, config }: StoriesProps) {
  const stories = [
    ...CoverStory(data, config),
    ...DisclaimerStory(data, config),
    ...NewMembersStory(data, config),
    ...SlackStories(data, config),
    ...GitHubStories(data, config),
    ...ProjectsStory(data, config),
    ...HighlightStories(data, config),
    ...OutroStory(data, config),
  ];

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const isTinyLandScape = useMediaQuery({
    query: "(max-height: 768px) and (orientation: landscape)",
  });
  const defaultWidth = 432;
  const defaultHeight = 768;

  const [width, setWidth] = useState<number | string>(defaultWidth);
  const [height, setHeight] = useState<number | string>(defaultHeight);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (isMobile) {
      setWidth(`100vw`);
      setHeight(`100dvh`);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isTinyLandScape) {
      setWidth(defaultWidth);
      setHeight(defaultHeight);

      if (window) {
        setScale((window.innerHeight / defaultHeight) * 0.9);
      }
    } else {
      setScale(1);
    }
  }, [isTinyLandScape]);

  return (
    <div className={isMobile ? "" : "h-screen flex justify-center flex-col"}>
      <ReactInstaStories
        stories={stories}
        defaultInterval={7000}
        width={width}
        height={height}
        keyboardNavigation={true}
        storyContainerStyles={{
          boxShadow: "0px 0px 72px 0px rgb(0 0 0)",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
        }}
      />
      {!isMobile && <ThankYou data={data} />}
    </div>
  );
}
