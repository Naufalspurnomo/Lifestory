/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
      },
      colors: {
        // === LUXURY WARM PALETTE ===

        // Neutral (hangat, premium)
        warm: {
          50: "#f9f6f1", // Background utama
          100: "#f2ede3", // Secondary button bg
          200: "#e6dbc7", // Border/Divider
        },

        // Text colors
        warmText: "#1d1a14", // Text utama
        warmMuted: "#5b5346", // Text sekunder

        // Border
        warmBorder: "#e6dbc7",

        // Aksen (Deep Teal - modern & elegan)
        accent: {
          DEFAULT: "#1f6f62",
          50: "#f0faf8",
          100: "#d0f0eb",
          200: "#a1e0d7",
          300: "#6bcabd",
          400: "#3dafa0",
          500: "#1f6f62",
          600: "#1a5c52",
          700: "#164a42",
          800: "#123b35",
          900: "#0e2d29",
        },

        // Gold palette (sesuai logo #b08e51)
        gold: {
          50: "#fbf8f0",
          100: "#f2ede3", // Secondary button bg
          200: "#ead9b3",
          300: "#dec088",
          400: "#d1a360",
          500: "#b08e51", // Primary Gold (logo)
          600: "#9e7743",
          700: "#82693c", // Primary button bg
          800: "#6a4b33",
          900: "#593f2e",
        },

        // Forest palette (deprecated, gunakan accent untuk pengganti)
        forest: {
          50: "#f0faf8",
          100: "#d0f0eb",
          200: "#a1e0d7",
          300: "#6bcabd",
          400: "#3dafa0",
          500: "#1f6f62", // Deep Teal
          600: "#1a5c52",
          700: "#164a42",
          800: "#123b35",
          900: "#0e2d29",
        },
      },
    },
  },
  plugins: [],
};
