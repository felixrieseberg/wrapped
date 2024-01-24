import skinTone, { SkinToneType } from "skin-tone";
import * as emoji from "node-emoji";
import Image from "next/image";

import { DataLight } from "../../interfaces";

export interface EmojiProps {
  name: string;
  data: DataLight;
}

const Emoji: React.FC<EmojiProps> = ({ name, data }: EmojiProps) => {
  // Custom Emoji
  if (data.slack.emoji[name]) {
    // Turn https://emoji.slack-edge.com/T024JLF7A/blobsalute/b9600848ebcfb2b4.png
    // into blobsalute.png
    const filename = extractFilenameFromURL(data.slack.emoji[name]);

    return (
      <Image
        className="inline-block"
        alt={name}
        src={`/emoji/${filename}`}
        width={30}
        height={30}
      />
    );
  }

  // Standard Emoji
  // altName is a hack to handle emoji that contain a *_face
  // and aren't quite standard.
  const altName = name.split("_")[0];
  const standardEmoji = getStandardEmoji(name) || getStandardEmoji(altName);

  if (standardEmoji) {
    return <span>{standardEmoji}</span>;
  }

  return <span>{name}</span>;
};

function getStandardEmoji(name: string) {
  const matches = name.match(/::skin-tone-(\d)/);

  if (matches && matches.length > 1) {
    // As defined by "skin-tone"
    const skinTones: Record<number, SkinToneType> = {
      0: "none",
      1: "white",
      2: "creamWhite",
      3: "lightBrown",
      4: "brown",
      5: "darkBrown",
    };

    const definedSkinTone = skinTones[parseInt(matches[1])];
    const nameWithoutSkinTone = name.replace(matches[0], "");
    const unmodified = emoji.get(nameWithoutSkinTone);

    if (!unmodified) {
      return null;
    }

    return skinTone(unmodified, definedSkinTone);
  } else {
    return emoji.get(name);
  }
}

function extractFilenameFromURL(url: string): string | null {
  // Use a regular expression to match the part between the last two slashes
  const matches = url.match(/\/([^/]+)\/([^/]+)\.png$/);

  if (matches && matches.length > 2) {
    // Return the matched part as the filename
    return matches[1] + ".png";
  } else {
    // Return null if no match is found
    return null;
  }
}

export default Emoji;
