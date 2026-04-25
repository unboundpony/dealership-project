/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cox PRISM - "Executive Navy" palette
        navy: {
          950: "#060B1A",
          900: "#0A1128",
          850: "#0E1836",
          800: "#122046",
          700: "#1A2C5B",
          600: "#243C79",
          500: "#2F4E9A",
          400: "#4A6DBD",
          300: "#7A94D4",
          200: "#B3C2E6",
          100: "#DCE3F3",
        },
        accent: {
          cyan: "#22D3EE",
          teal: "#14B8A6",
          gold: "#F5B700",
          amber: "#F59E0B",
          coral: "#FB7185",
          crimson: "#EF4444",
          emerald: "#10B981",
        },
        ink: {
          50: "#F5F7FB",
          100: "#E6EBF4",
          200: "#C8D1E3",
          300: "#96A3BE",
          400: "#6B7895",
          500: "#475066",
          600: "#2D3449",
          700: "#1A2036",
          800: "#111627",
          900: "#0A0E1C",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        executive:
          "0 1px 2px rgba(6, 11, 26, 0.45), 0 12px 40px -12px rgba(6, 11, 26, 0.55)",
        ring: "0 0 0 1px rgba(122, 148, 212, 0.18)",
        glow: "0 0 0 1px rgba(34, 211, 238, 0.35), 0 0 24px rgba(34, 211, 238, 0.18)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(122,148,212,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(122,148,212,0.06) 1px, transparent 1px)",
        "radial-navy":
          "radial-gradient(1200px 600px at 20% -10%, rgba(47,78,154,0.35), transparent 60%), radial-gradient(900px 500px at 110% 10%, rgba(34,211,238,0.12), transparent 55%)",
      },
      keyframes: {
        "pulse-ring": {
          "0%,100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        "sync-blink": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "score-rise": {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2.4s ease-in-out infinite",
        "sync-blink": "sync-blink 1.6s ease-in-out infinite",
        "score-rise": "score-rise 600ms ease-out both",
      },
    },
  },
  plugins: [],
};
