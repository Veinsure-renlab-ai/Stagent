import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        twitch: {
          bg: "#0e0e10",
          surface: "#18181b",
          border: "#26262c",
          text: "#efeff1",
          muted: "#adadb8",
          accent: "#9147ff",
        },
      },
    },
  },
  plugins: [],
}

export default config
