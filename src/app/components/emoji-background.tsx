import React, { useEffect, useState } from "react";
import "./emoji-background.css";

const generateRandomEmojis = (lineCount: number, emojisPerLine: number) => {
  const emojis = [
    "😀",
    "😂",
    "🤣",
    "😍",
    "😎",
    "🥳",
    "🤩",
    "🚀",
    "🌈",
    "🔥",
    "🌟",
    "🎉",
    "🐱‍🐉",
    "🍕",
    "🌺",
    "🌞",
    "🍦",
    "🎶",
    "🏖️",
    "🧁",
    "🌸",
    "🌼",
    "🦄",
    "🍭",
    "🌮",
    "🎈",
    "🌻",
    "📚",
    "🍂",
    "🌅",
  ];
  let lines = [];
  for (let i = 0; i < lineCount; i++) {
    let line = new Array(emojisPerLine)
      .fill("")
      .map(() => emojis[Math.floor(Math.random() * emojis.length)])
      .join(" ");
    lines.push(line);
  }
  return lines.join("");
};

const RandomEmojiBackground: React.FC = () => {
  const [emojis, setEmojis] = useState<string>("");

  useEffect(() => {
    // Adjust the number to control the density of emojis
    setEmojis(generateRandomEmojis(200, 30));
  }, []);

  return <div className="emoji-background">{emojis}</div>;
};

export default RandomEmojiBackground;
