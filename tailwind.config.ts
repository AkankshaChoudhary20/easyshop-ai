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
        brand: {
          DEFAULT: "#0E7C61",
          hover: "#0B6A53",
          subtle: "#E6F5EF",
          muted: "#0B6A53",
        },
        ink: {
          50: "#F7F7F5",
          100: "#E7E5E1",
          400: "#8A8781",
          600: "#5C5951",
          950: "#1B1A17",
        },
        danger: { DEFAULT: "#D7473F", bg: "#FBEAE9" },
        warning: { DEFAULT: "#B5760F", bg: "#FBF0DD" },
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        focus: "0 0 0 3px rgba(14,124,97,.18)",
      },
    },
  },
  plugins: [],
};
export default config;
