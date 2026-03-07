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
        sidebar: "#1C1917",
        "sidebar-hover": "#292524",
        "sidebar-active-bg": "rgba(249,115,22,0.12)",
        "sidebar-active": "#F97316",
        "canvas": "#FAFAF9",
        "surface": "#FFFFFF",
        "border-subtle": "#E7E5E4",
        "text-primary": "#1C1917",
        "text-secondary": "#78716C",
        "text-muted": "#A8A29E",
        brand: {
          orange: "#F97316",
          "orange-light": "#FED7AA",
          "orange-dark": "#EA580C",
        },
        status: {
          "on-track-bg": "#DCFCE7",
          "on-track-text": "#15803D",
          "at-risk-bg": "#FEF9C3",
          "at-risk-text": "#A16207",
          "delayed-bg": "#FFE4E6",
          "delayed-text": "#BE123C",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(28,25,23,0.06), 0 4px 12px rgba(28,25,23,0.04)",
        "card-hover": "0 4px 16px rgba(28,25,23,0.10), 0 1px 4px rgba(28,25,23,0.06)",
        "new-project": "0 2px 8px rgba(249,115,22,0.30)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
