export function calculateWordsInString(input: string = "") {
  return input.split(" ").filter((w) => /\w+/.test(w)).length;
}
