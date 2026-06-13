/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "DM Sans", "ui-sans-serif", "system-ui"],
        display: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        energy: {
          blue: "#0EA5E9",
          navy: "#0F172A",
          green: "#10B981",
          mint: "#D1FAE5",
        },
      },
      boxShadow: {
        soft: "0 18px 55px rgba(15, 23, 42, 0.10)",
        lift: "0 24px 70px rgba(15, 23, 42, 0.14)",
      },
    },
  },
  plugins: [],
};
