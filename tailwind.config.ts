import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f1f3f7",
        ink: "#121a2b",
        muted: "#5b6577",
        line: "#d9dee8",
        mark: "#f5b82e",
        brand: { DEFAULT: "#2b4fcf", dark: "#213fa6", soft: "#e6ebfb" },
      },
    },
  },
  plugins: [],
};
export default config;
