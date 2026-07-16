import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Editor-inspired palette — every color has a job that mirrors a real editor role.
        ink: {
          950: "#05070C", // page background — deeper than any editor bg, so the "screen" reads brighter
          900: "#0A0E14", // editor background (One Dark / Night Owl territory)
          800: "#0F141C",
          700: "#161C26",
          600: "#232A36",
          500: "#3A4453",
        },
        paper: {
          100: "#E6E9EF", // primary text, like editor foreground
          300: "#ABB2BF", // secondary text / comments
          500: "#5C6370", // muted / line numbers
        },
        accent: {
          blue: "#61AFEF", // keywords / links / primary accent
          cyan: "#56B6C2", // types
          violet: "#C678DD", // strings / secondary accent
          green: "#98C379", // success / terminal prompt
          amber: "#E5C07B", // warnings / highlight
          red: "#E06C75", // errors / delete markers
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(3rem, 8vw, 7rem)", { lineHeight: "0.95", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2.25rem, 5vw, 4rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.5rem, 3vw, 2.25rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
      },
      boxShadow: {
        laptop: "0 60px 120px -40px rgba(0,0,0,0.65)",
        glow: "0 0 40px -8px rgba(97,175,239,0.45)",
      },
      backgroundImage: {
        grid: "linear-gradient(to right, rgba(171,178,191,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(171,178,191,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
      keyframes: {
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        marquee: "marquee 28s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
