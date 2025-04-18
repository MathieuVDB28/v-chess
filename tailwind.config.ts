import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        sidebar: "hsl(var(--card))",
        input: "hsl(var(--input))",
        chart4: "hsl(var(--chart-4))",
        destructive: "hsl(var(--destructive))",
      },
    },
  },
  plugins: [],
} satisfies Config;
