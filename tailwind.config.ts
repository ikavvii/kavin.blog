import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        term: {
          bg: "var(--term-bg)",
          panel: "var(--term-panel)",
          panel2: "var(--term-panel2)",
          border: "var(--term-border)",
          fg: "var(--term-fg)",
          dim: "var(--term-dim)",
          green: "var(--term-green)",
          amber: "var(--term-amber)",
          cyan: "var(--term-cyan)",
          red: "var(--term-red)",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px var(--term-border), 0 0 24px -12px var(--term-green)",
      },
      animation: {
        blink: "blink 1.1s step-end infinite",
        fadeUp: "fadeUp 0.35s ease-out both",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
