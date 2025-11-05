import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "#1a1a1a",
        "surface-light": "#2a2a2a",
        primary: {
          DEFAULT: "#3B82F6",
          dark: "#2563EB",
        },
      },
    },
  },
  plugins: [],
};

export default config;
