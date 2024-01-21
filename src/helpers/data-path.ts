import path from "path";
import { Config } from "../data/config.js";

const dataPaths: Record<string, string> = {};

export function getDataPath(config: Config, id: string = ""): string {
  if (!dataPaths[id]) {
    const _id = id ? `-${id}` : "";

    dataPaths[id] = path.join(
      process.cwd(),
      "data",
      `data-${config.from.getTime()}-${config.to.getTime()}${_id}.json`,
    );
  }

  return dataPaths[id];
}

export function getLightDataPath(config: Config): string {
  return getDataPath(config).replace(".json", ".light.json");
}
