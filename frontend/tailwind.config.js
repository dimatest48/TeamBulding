/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark surfaces
        canvas: "#08080a",
        panel: "#111114",
        elevated: "#16161a",
        line: "rgba(255,255,255,0.08)",
        "line-strong": "rgba(255,255,255,0.14)",
        // Text
        fg: "#f4f4f5",
        dim: "#a1a1aa",
        faint: "#71717a",
        // Vibrant accents (chrome only)
        accent: { DEFAULT: "#6366f1", 2: "#8b5cf6" },
        // Semantic (priority / status)
        amber: { DEFAULT: "#e8a531", deep: "#c97f1c" },
        rose: "#f87171",
        sage: "#6f9b6e",
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
        soft: "0 24px 60px -28px rgba(0, 0, 0, 0.8)",
        "soft-sm": "0 8px 24px -12px rgba(0, 0, 0, 0.7)",
        glow: "0 0 0 1px rgba(99,102,241,0.4), 0 12px 40px -12px rgba(99,102,241,0.55)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.7s ease forwards",
      },
    },
  },
  plugins: [],
};
