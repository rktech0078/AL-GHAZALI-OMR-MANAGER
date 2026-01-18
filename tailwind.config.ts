import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      zIndex: {
        'navbar': '50',
        'sidebar': '40',
        'mobile-menu-overlay': '55',
        'mobile-menu': '60',
        'modal-overlay': '70',
        'modal': '80',
        'loader': '90',
        'toast': '100',
      },
    },
  },
  plugins: [],
};
export default config;
