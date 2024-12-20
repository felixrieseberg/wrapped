/**
 * Calculates the number of images in a string.
 *
 * @param input - The string to calculate the number of images in.
 * @returns The number of images in the string.
 */
export function calculateImagesInString(input: string = "") {
  // GitHub markdown images can be in two formats:
  // 1. HTML: <img src="...">
  // 2. Markdown: ![alt text](url)
  
  // Match HTML img tags
  const htmlRegex = /<img[^>]+src="([^">]+)"/g;
  const htmlMatches = input.match(htmlRegex) || [];

  // Match markdown image syntax
  const markdownRegex = /!\[.*?\]\((.*?)\)/g;
  const markdownMatches = input.match(markdownRegex) || [];

  return htmlMatches.length + markdownMatches.length;
}
