"use client";

import ReactInstaStories from "react-insta-stories";

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
import useScreenWidth from "../helpers/use-screen-size";

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

  const { windowWidth, windowHeight } = useScreenWidth();
  const isMobile = windowWidth && windowHeight && windowWidth < 768;
  const isTinyLandScape =
    windowWidth &&
    windowHeight &&
    windowHeight < 768 &&
    windowWidth > windowHeight;
  const defaultWidth = 432;
  const defaultHeight = 768;

  const [hideOnMobile, setHideOnMobile] = useState(false);
  const [width, setWidth] = useState<number | string>(defaultWidth);
  const [height, setHeight] = useState<number | string>(defaultHeight);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (isMobile) {
      setWidth(`100vw`);
      setHeight(`100dvh`);
      setHideOnMobile(true);
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
    <div
      className={hideOnMobile ? "" : "h-screen flex justify-center flex-col"}
    >
      <ReactInstaStories
        stories={stories}
        defaultInterval={10000}
        width={width}
        height={height}
        keyboardNavigation={true}
        storyContainerStyles={{
          boxShadow: "0px 0px 72px 0px rgb(0 0 0)",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
        }}
      />
      {!hideOnMobile && <ThankYou data={data} />}
    </div>
  );
}
