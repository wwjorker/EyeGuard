/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        bg: {
          DEFAULT: "var(--eg-bg)",
          card: "var(--eg-card)",
          hover: "var(--eg-hover)",
        },
        eg: {
          green: "var(--eg-green)",
          purple: "var(--eg-purple)",
          amber: "var(--eg-amber)",
          pink: "var(--eg-pink)",
          text: "var(--eg-text)",
          muted: "var(--eg-muted)",
          faint: "var(--eg-faint)",
          line: "var(--eg-line)",
        },
      },
      borderRadius: {
        card: "16px",
        btn: "8px",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
