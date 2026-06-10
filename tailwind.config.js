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
        // === LIFESTORY DESIGN SYSTEM ===
        // Single source of truth. Do not introduce new ad-hoc hex.

        // Cream / warm neutral background scale
        cream: {
          50: "#fdfbf6",
          100: "#faf6ed",
          200: "#f5efe1",
          300: "#ece2cc",
          400: "#dccfb3",
          500: "#c5b395",
        },

        // Ink (text) scale
        ink: {
          50: "#fffaf0",
          100: "#e9e0d0",
          300: "#9c8e7e",
          500: "#73685f",
          600: "#5a4d42",
          700: "#40342c",
          800: "#3f342d",
          900: "#1d1610",
        },

        // Logo bronze - used for CTA, highlights, eyebrow accents
        brand: {
          50: "#f8f3e8",
          100: "#efe4d0",
          200: "#dfceb0",
          300: "#c8b187",
          400: "#aa8d5c",
          500: "#927648",
          600: "#82693c",
          700: "#82693c", // logo bronze
          800: "#604b2d",
          900: "#3f2f1d",
        },

        // Aliases retained for backward compatibility
        gold: {
          50: "#f8f3e8",
          100: "#efe4d0",
          200: "#dfceb0",
          300: "#c8b187",
          400: "#aa8d5c",
          500: "#927648",
          600: "#82693c",
          700: "#82693c",
          800: "#604b2d",
          900: "#3f2f1d",
        },

        warm: {
          50: "#fdfbf6",
          100: "#faf6ed",
          200: "#f5efe1",
          300: "#ece2cc",
        },
        warmText: "#3f342d",
        warmMuted: "#73685f",
        warmBorder: "#ece2cc",

        // Logo accent alias - kept for older components that still reference accent-*
        accent: {
          DEFAULT: "#82693c",
          50: "#f8f3e8",
          100: "#efe4d0",
          200: "#dfceb0",
          300: "#c8b187",
          400: "#aa8d5c",
          500: "#82693c",
          600: "#6f5633",
          700: "#604b2d",
          800: "#4b3a24",
          900: "#1d1610",
        },

        // Status colors
        success: "#3a6e44",
        warning: "#9d6e1c",
        danger: "#b34a4a",
      },
      borderRadius: {
        pill: "9999px",
        card: "20px",
        "card-lg": "28px",
      },
      boxShadow: {
        soft: "0 14px 28px rgba(59,43,24,0.08)",
        elev: "0 18px 36px rgba(59,43,24,0.12)",
        lift: "0 22px 44px rgba(59,43,24,0.16)",
        deep: "0 28px 60px rgba(17,12,8,0.24)",
        cta: "0 14px 30px rgba(130,105,60,0.28)",
        "cta-hover": "0 22px 40px rgba(130,105,60,0.38)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #82693c 0%, #604b2d 58%, #3f2f1d 100%)",
        "cream-fade":
          "linear-gradient(180deg, #fdfbf6 0%, #faf6ed 60%, #f5efe1 100%)",
        "grain":
          "radial-gradient(circle at 1px 1px, rgba(164,146,117,0.10) 1px, transparent 0)",
      },
      backgroundSize: {
        grain: "24px 24px",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "shine-sweep": {
          "0%": { transform: "translateX(-150%) skewX(-20deg)" },
          "100%": { transform: "translateX(250%) skewX(-20deg)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.7s ease-out both",
        "fade-in": "fade-in 0.5s ease-out both",
        marquee: "marquee 38s linear infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "shine-sweep": "shine-sweep 1.2s ease-out",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      maxWidth: {
        prose: "68ch",
        page: "1320px",
      },
    },
  },
  plugins: [],
};
