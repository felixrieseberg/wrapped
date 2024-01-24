import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "notion-yellow": "#FAF3DD",
        "notion-orange": "#F8ECDF",
        "notion-paper": "#f7f6f3"
      },
      container: {
        center: true,
      },
      background: {},
    },
  },
  plugins: [],
};
export default config;
