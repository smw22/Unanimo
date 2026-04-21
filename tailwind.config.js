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
        "light-bg": "#ffffff",
        "dark-bg": "#0d0d0d",
        navbar: "#111111",
        card: "#1a1a1a",
        border: "#2a2a2a",
        "text-primary": "#ffffff",
        "text-secondary": "#888888",
        "text-muted": "#555555",
        "dark-text": "#0d0d0d",
      },
      spacing: {
        15.5: "62px",
        "container-spacing": "40px",
        "top-spacing": "80px",
      },
    },
  },
  presets: [require("nativewind/preset")],
};
