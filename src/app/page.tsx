import fs from "fs-extra";
import path from "path";

import Stories from "./stories/stories";

import { loadConfig, Config } from "../data/config";
import { getLightDataPath } from "../helpers/data-path";
import { DataLight } from "../interfaces";

export default async function Wrapped() {
  const { config, data } = await getConfigAndData();

  return (
    <div className="container w-full h-full">
      <div className="flex flex-wrap justify-center content-center h-full">
        <Stories data={data} config={config} />
      </div>
    </div>
  );
}

interface ConfigAndData {
  config: Config;
  data: DataLight;
}

async function getConfigAndData(): Promise<ConfigAndData> {
  const config = await loadConfig(path.join(process.cwd(), "config.json"));
  const dataPath = await getLightDataPath(config);
  const data = await fs.readJSON(dataPath);

  return { config, data };
}
