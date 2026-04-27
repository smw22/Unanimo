/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7b2fff",
        accent: "#a57fff",
        surface: "#1c1033",
        success: "#39c060",
        danger: "#ff3b3b",
        warning: "#ffb347",
        "light-bg": "#ffffff", // light background
        "dark-bg": "#0d0d0d", // dark background
        navbar: "#111111",
        card: "#1a1a1a",
        border: "#2a2a2a",
        "input-bg": "#F3F4F6", // light background
        "input-border": "#E5E7EB", // light border
        "input-bg-dark": "#0B0B0D", // dark background
        "input-border-dark": "#1F1F1F",
        "label-primary": "#8E8E8E",
        "text-primary": "#ffffff", //light text color
        "text-secondary": "#888888",
        "text-muted": "#555555",
        "dark-text": "#0d0d0d", // dark text color
      },
      spacing: {
        15.5: "62px",
        "container-spacing": "20px",
      },
    },
  },
  presets: [require("nativewind/preset")],
};
