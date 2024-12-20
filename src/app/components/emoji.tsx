import Image from "next/image";

import { DataLight } from "../../interfaces";
import { getStandardEmoji } from "../helpers/emoji";

export interface EmojiProps {
  name: string;
  data: DataLight;
}

const Emoji: React.FC<EmojiProps> = ({ name, data }: EmojiProps) => {
  const extractedCustomEmoji = extractAlias(name, data)

  // Custom Emoji
  if (extractedCustomEmoji) {
    return (
      <Image
        className="inline-block"
        alt={name}
        src={extractedCustomEmoji}
        width={30}
        height={30}
      />
    );
  }
  const standardEmoji = getStandardEmoji(name)

  if (standardEmoji) {
    return <span>{standardEmoji}</span>;
  }

  return <span>{name}</span>;
};

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

/**
 * If the emoji is alias:*, return the name of the emoji  
 * 
 * @param name 
 */
function extractAlias(name: string, data: DataLight) {
  const result = data.slack.emoji[name]

  if (result && result.startsWith('alias:')) {
    return extractAlias(result.replace('alias:', ''), data)
  }

  return result
}

export default Emoji;
