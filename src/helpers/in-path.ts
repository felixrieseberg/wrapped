import path from "path";

export function getInPath(filename: string) {
  return path.join(process.cwd(), filename);
}
