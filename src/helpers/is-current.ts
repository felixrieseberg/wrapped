import { Config } from "../data/config";

export function isCurrent(config: Config, createdOn?: Date): boolean {
  if (!createdOn) {
    return false;
  }

  const now = new Date();
  const to = config.to;

  // If data was created after the "to" date, return true
  if (createdOn > to) {
    return true;
  }

  // If it was created within 10 minutes of now, return true
  if (now.getTime() - createdOn.getTime() < 1000 * 60 * 10) {
    return true;
  }

  return false;
}
