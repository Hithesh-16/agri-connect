import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B6B3A",
          light: "#2D8A50",
          dark: "#144F2C",
        },
        accent: {
          DEFAULT: "#F5A623",
          light: "#FFC457",
        },
        kisan: {
          green: "#22C55E",
          red: "#EF4444",
          orange: "#F97316",
          blue: "#3B82F6",
          bg: "#F6F8F4",
          card: "#FFFFFF",
          border: "#E5EBE0",
          text: "#1A2416",
          "text-secondary": "#5A6A54",
          "text-light": "#9AAF91",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
