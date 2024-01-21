"use client";

import ReactInstaStories from "react-insta-stories";
import StoryIntro from "./intro";
import DisclaimerStory from "./disclaimer";
import { Data, DataLight } from "../../interfaces";
import { Config } from "../../data/config";
import GitHubStories from "./github";
import NewMembersStory from "./new-members";
import { useEffect, useState } from "react";

export interface StoriesProps {
  data: DataLight;
  config: Config;
}

export default function Stories({ data, config }: StoriesProps) {
  const stories = [
    ...StoryIntro(data, config),
    ...DisclaimerStory(data, config),
    ...NewMembersStory(data, config),
    ...GitHubStories(data, config),
  ];

  return (
    <ReactInstaStories
      stories={stories}
      defaultInterval={7000}
      width={432}
      height={768}
      keyboardNavigation={true}
      storyContainerStyles={{
        boxShadow: "0px 0px 72px 0px rgb(0 0 0)",
      }}
    />
  );
}
