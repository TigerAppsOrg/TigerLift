/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        theme_light_1: "#e7eefa",
        theme_medium_1: "#7ba9ed",
        theme_dark_1: "#3478da",
        theme_light_2: "#f7e6e4",
        theme_medium_2: "#F07F73",
        theme_dark_2: "#e34a39",
        info_light: "#FDF5EC",
        theme_light_3: "#f8eee0",
        theme_medium_3: "#f5a500",
        theme_bg: "#ededf6",
        theme_light_green: "#c5e5e3",
        theme_green: "#5AAFAA",
        theme_dark_green: "#145F5B",
        theme_light_red: "#f7b4b4",
        theme_red: "#f76f6f",
        theme_dark_red: "#9d1010",

        // TigerLift facelift (TIG-339): semantic colors from the Figma
        // design system ("03 · Semantic colors").
        lift: {
          page: "#f9f8f7", // bg-page
          surface: "#ffffff", // bg-surface
          subtle: "#eeebe6", // bg-subtle: chips, labels, tab bar
          muted: "#dfdcd4", // bg-muted: avatar placeholders
          placeholder: "#a7a39c", // bg-placeholder: "Full" button
          ink: "#161513", // text-primary
          secondary: "#66615a", // text-secondary
          "on-inverse": "#eeebe6", // text on dark buttons
          border: "#c8c4bb", // border-default
          "border-strong": "#a7a39c",
          inverse: "#2e2b26", // fill-primary / border-inverse
          "inverse-pressed": "#4a463f",
          accent: "#e1ff01", // fill-accent: banner, create button
          "accent-pressed": "#cde800",
          danger: "#cd4230",
          "danger-bg": "#fbe6e1",
          "danger-text": "#a3301f",
          "success-bg": "#e6f0d9",
          "success-text": "#4f7a18",
          "info-bg": "#dce8ea",
          "info-text": "#1f3e46",
        },
      },
      fontFamily: {
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
      },
      // type scale from "04 · Desktop typography" / "05 · Mobile typography"
      fontSize: {
        display: ["72px", { lineHeight: "76px", letterSpacing: "-1.44px" }],
        "display-m": ["40px", { lineHeight: "44px", letterSpacing: "-0.8px" }],
        h2: ["40px", { lineHeight: "44px", letterSpacing: "-0.4px" }],
        "h2-m": ["24px", { lineHeight: "28px", letterSpacing: "-0.24px" }],
        h3: ["28px", { lineHeight: "32px" }],
        subhead: ["20px", { lineHeight: "28px" }],
        "subhead-m": ["18px", { lineHeight: "24px" }],
        "body-lg": ["18px", { lineHeight: "28px" }],
        label: ["16px", { lineHeight: "16px", letterSpacing: "0.64px" }],
        "label-m": ["12px", { lineHeight: "16px", letterSpacing: "0.24px" }],
        "small-m": ["12px", { lineHeight: "16px" }],
      },
      boxShadow: {
        floating: "0 1px 3px rgba(22, 21, 19, 0.06), 0 6px 16px rgba(22, 21, 19, 0.1)",
      },
    },
  },
  plugins: [],
};
