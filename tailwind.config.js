/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"Outfit"', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#FDF6EC',
        warmblack: '#1A1611',
        terracotta: '#C75B3A',
        sage: '#7A8B6F',
        plum: '#6B2FA0',
        'plum-light': '#9B5FD0',
        'plum-dark': '#4A1F70',
      },
      keyframes: {
        'chef-pulse': {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '15%': { transform: 'scale(1.12) rotate(-8deg)' },
          '30%': { transform: 'scale(1.05) rotate(6deg)' },
          '45%': { transform: 'scale(1.1) rotate(-5deg)' },
          '60%': { transform: 'scale(1.03) rotate(4deg)' },
          '75%': { transform: 'scale(1.08) rotate(-3deg)' },
          '90%': { transform: 'scale(1.02) rotate(2deg)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-ring': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.15)' },
        },
      },
      animation: {
        'chef-pulse': 'chef-pulse 1.2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'glow-ring': 'glow-ring 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
