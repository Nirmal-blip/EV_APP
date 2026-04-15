/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16A34A',
          light:   '#22C55E',
          dark:    '#15803D',
        },
        background: '#F8FAFC',
      },
      fontFamily: {
        display: ["'Clash Display'", 'system-ui', 'sans-serif'],
        body:    ["'Cabinet Grotesk'", 'system-ui', 'sans-serif'],
        sans:    ["'Cabinet Grotesk'", 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'card':   '0 4px 24px rgba(15, 23, 42, 0.06)',
        'card-lg':'0 20px 60px rgba(15, 23, 42, 0.10)',
        'green':  '0 8px 24px rgba(22, 163, 74, 0.22)',
      },
      animation: {
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};