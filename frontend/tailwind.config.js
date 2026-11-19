/** @type {import('tailwindcss').Config} */

// Design tokens from Figma (TIG-340). Colour values are CSS variables
// defined in src/styles/tokens.css, so this file only names them.
// Note: because they are var() values, opacity modifiers (bg-surface/50)
// do not apply to the token colours.
const v = (name) => `var(--${name})`;

// Figma type styles: [size, { lineHeight, letterSpacing, fontWeight }].
// Headings (display/h1/h2/h3) should be paired with `font-display` (Sora).
const fontSize = {
  "desktop-display": ["72px", { lineHeight: "76px", letterSpacing: "-0.02em", fontWeight: "800" }],
  "desktop-h1": ["56px", { lineHeight: "60px", letterSpacing: "-0.02em", fontWeight: "700" }],
  "desktop-h2": ["40px", { lineHeight: "44px", letterSpacing: "-0.01em", fontWeight: "700" }],
  "desktop-h3": ["28px", { lineHeight: "32px", letterSpacing: "0", fontWeight: "600" }],
  "desktop-subhead": ["20px", { lineHeight: "28px", letterSpacing: "0", fontWeight: "600" }],
  "desktop-body": ["16px", { lineHeight: "24px", letterSpacing: "0", fontWeight: "400" }],
  "desktop-body-xl": ["20px", { lineHeight: "24px", letterSpacing: "0", fontWeight: "400" }],
  "desktop-body-lg": ["18px", { lineHeight: "28px", letterSpacing: "0", fontWeight: "400" }],
  "desktop-small": ["14px", { lineHeight: "20px", letterSpacing: "0", fontWeight: "500" }],
  "desktop-label": ["16px", { lineHeight: "16px", letterSpacing: "0.04em", fontWeight: "500" }],
  "desktop-button": ["16px", { lineHeight: "20px", letterSpacing: "0", fontWeight: "700" }],
  "desktop-nav": ["16px", { lineHeight: "24px", letterSpacing: "0", fontWeight: "500" }],
  "mobile-display": ["40px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "800" }],
  "mobile-h1": ["32px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "700" }],
  "mobile-h2": ["24px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "700" }],
  "mobile-h3": ["20px", { lineHeight: "24px", letterSpacing: "0", fontWeight: "600" }],
  "mobile-subhead": ["18px", { lineHeight: "24px", letterSpacing: "0", fontWeight: "600" }],
  "mobile-body": ["16px", { lineHeight: "24px", letterSpacing: "0", fontWeight: "400" }],
  "mobile-body-lg": ["18px", { lineHeight: "28px", letterSpacing: "0", fontWeight: "400" }],
  "mobile-small-bold": ["12px", { lineHeight: "16px", letterSpacing: "0", fontWeight: "600" }],
  "mobile-small": ["12px", { lineHeight: "16px", letterSpacing: "0", fontWeight: "400" }],
  "mobile-xs": ["10px", { lineHeight: "14px", letterSpacing: "0", fontWeight: "400" }],
  "mobile-label": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "500" }],
  "mobile-label-sm": ["10px", { lineHeight: "12px", letterSpacing: "0", fontWeight: "400" }],
  "mobile-button": ["16px", { lineHeight: "20px", letterSpacing: "0", fontWeight: "600" }],
};

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic tokens (Figma "Semantic colors"). Use these in new UI.
        surface: {
          DEFAULT: v("color-bg-surface"),
          page: v("color-bg-page"),
          subtle: v("color-bg-subtle"),
          inverse: v("color-bg-inverse"),
          muted: v("color-bg-muted"),
          placeholder: v("color-bg-placeholder"),
          scrim: v("color-bg-scrim"),
        },
        content: {
          primary: v("color-text-primary"),
          secondary: v("color-text-secondary"),
          placeholder: v("color-text-placeholder"),
          disabled: v("color-text-disabled"),
          "on-inverse": v("color-text-on-inverse"),
          "on-accent": v("color-text-on-accent"),
          accent: v("color-text-accent"),
          "on-danger": v("color-text-on-danger"),
        },
        icon: {
          primary: v("color-icon-primary"),
          muted: v("color-icon-muted"),
        },
        line: {
          DEFAULT: v("color-border-default"),
          strong: v("color-border-strong"),
          inverse: v("color-border-inverse"),
          subtle: v("color-border-subtle"),
        },
        fill: {
          primary: v("color-fill-primary"),
          "primary-pressed": v("color-fill-primary-pressed"),
          accent: v("color-fill-accent"),
          "accent-pressed": v("color-fill-accent-pressed"),
          "accent-subtle": v("color-fill-accent-subtle"),
        },
        status: {
          danger: v("color-status-danger"),
          "danger-bg": v("color-status-danger-bg"),
          "danger-text": v("color-status-danger-text"),
          success: v("color-status-success"),
          "success-bg": v("color-status-success-bg"),
          "success-text": v("color-status-success-text"),
          "info-bg": v("color-status-info-bg"),
          "info-text": v("color-status-info-text"),
        },

        // Legacy colours from the old design. Existing pages still use them;
        // migrate to the semantic tokens above, do not add new usages.
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
      fontFamily: {
        sans: ["Inter", "system-ui", "Avenir", "Helvetica", "Arial", "sans-serif"],
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
      },
      fontSize,
      spacing: {
        gutter: "64px", // desktop page gutter
        "gutter-mobile": "20px", // mobile page gutter
        nav: "91px", // desktop nav height (90 + 1px border)
        tabbar: "84px", // mobile bottom tab bar height
        control: "42px", // button / control height
        fab: "64px", // mobile create button diameter
      },
      borderRadius: {
        control: "4px",
      },
      boxShadow: {
        "elevation-1": "0 1px 2px rgba(22,21,19,.06), 0 2px 6px rgba(22,21,19,.04)",
        "elevation-2": "0 1px 3px rgba(22,21,19,.06), 0 6px 16px rgba(22,21,19,.10)",
        "elevation-3": "0 2px 8px rgba(22,21,19,.06), 0 16px 40px rgba(22,21,19,.16)",
      },
    },
  },
  plugins: [],
};
