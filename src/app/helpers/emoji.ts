import skinTone, { SkinToneType } from "skin-tone";
import * as emoji from "node-emoji";

export function getIsStandardEmoji(name: string) {
  return !!getNodeEmoji(name);
}

export function getStandardEmoji(name: string) {
  // Standard Emoji
  // altName is a hack to handle emoji that contain a *_face
  // and aren't quite standard.
  const altName = name.split("_")[0];
  return getNodeEmoji(name) || getNodeEmoji(altName);
}

export function getNodeEmoji(name: string) {
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
