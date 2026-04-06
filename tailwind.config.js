/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "outline": "#8a8c9a",
        "on-secondary-container": "#585a68",
        "on-secondary": "#ffffff",
        "tertiary-fixed": "#f1f5f9",
        "surface-container": "#e2e4ea",
        "surface-container-high": "#dcdee4",
        "secondary": "#475569",
        "tertiary-fixed-dim": "#cbd5e1",
        "secondary-fixed": "#e2e8f0",
        "primary-fixed": "#e0e7ff",
        "on-primary-container": "#1e293b",
        "tertiary": "#334155",
        "primary-container": "#f1f5f9",
        "primary": "#1e293b",
        "on-tertiary-container": "#1e293b",
        "surface-dim": "#d4d6dc",
        "surface": "#e8eaf0",
        "on-secondary-fixed": "#0f172a",
        "on-tertiary-fixed-variant": "#334155",
        "on-surface-variant": "#475569",
        "on-primary-fixed": "#0f172a",
        "on-error-container": "#991b1b",
        "tertiary-container": "#f8fafc",
        "inverse-on-surface": "#e8eaf0",
        "inverse-primary": "#94a3b8",
        "error": "#dc2626",
        "surface-container-lowest": "#f0f2f8",
        "surface-bright": "#edeef4",
        "background": "#e8eaf0",
        "on-background": "#1e293b",
        "on-tertiary": "#ffffff",
        "on-primary": "#ffffff",
        "on-error": "#ffffff",
        "inverse-surface": "#1e293b",
        "surface-container-low": "#e5e7ed",
        "on-tertiary-fixed": "#0f172a",
        "surface-container-highest": "#d6d8de",
        "outline-variant": "#d0d2dc",
        "surface-tint": "#1e293b",
        "on-secondary-fixed-variant": "#334155",
        "secondary-container": "#e2e8f0",
        "primary-fixed-dim": "#94a3b8",
        "on-primary-fixed-variant": "#334155"
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["Plus Jakarta Sans", "sans-serif"],
        "body": ["Plus Jakarta Sans", "sans-serif"],
        "label": ["Plus Jakarta Sans", "sans-serif"]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}