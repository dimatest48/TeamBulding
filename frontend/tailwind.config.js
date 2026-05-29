/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14182b",
          soft: "#232843",
          line: "#2e3450",
        },
        paper: {
          DEFAULT: "#f7f3ea",
          2: "#efe8d8",
        },
        cloud: "#fbfaf6",
        amber: {
          DEFAULT: "#e8a531",
          deep: "#c97f1c",
        },
        rose: "#e0573e",
        sage: "#6f9b6e",
        ink_text: "#1c2033",
        dim: "#5d6178",
        "on-ink": "#ece7da",
        "on-ink-dim": "#9aa0bd",
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: "18px",
      },
      spacing: {
        "4.5": "1.125rem",
        "5.5": "1.375rem",
      },
      boxShadow: {
        soft: "0 18px 50px -22px rgba(20, 24, 43, 0.45)",
        "soft-sm": "0 6px 20px -10px rgba(20, 24, 43, 0.35)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        floaty: {
          "0%,100%": { transform: "rotate(1.4deg) translateY(0)" },
          "50%": { transform: "rotate(1.4deg) translateY(-12px)" },
        },
      },
      animation: {
        rise: "rise 0.7s ease forwards",
        floaty: "floaty 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
