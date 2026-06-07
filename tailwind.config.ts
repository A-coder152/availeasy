import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // Ensures Tailwind knows to look for the .dark class
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Broadened to catch everything in src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
