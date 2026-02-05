/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Design 1: Vinyl Dreams
        'playfair': ['"Playfair Display"', 'serif'],
        'lora': ['Lora', 'serif'],
        // Design 2: Neon Underground
        'orbitron': ['Orbitron', 'sans-serif'],
        'jetbrains': ['"JetBrains Mono"', 'monospace'],
        // Design 3: Liquid Aurora
        'outfit': ['Outfit', 'sans-serif'],
        'dm-sans': ['"DM Sans"', 'sans-serif'],
        // Design 4: Neo Brutalism
        'space-mono': ['"Space Mono"', 'monospace'],
        'work-sans': ['"Work Sans"', 'sans-serif'],
        // Design 5: Cosmos Data
        'audiowide': ['Audiowide', 'cursive'],
        'ibm-plex': ['"IBM Plex Sans"', 'sans-serif'],
      },
      colors: {
        // Design 1: Vinyl Dreams
        vinyl: {
          brown: '#3d2914',
          orange: '#ff6b35',
          cream: '#fef5e7',
          wood: '#8b4513',
        },
        // Design 2: Neon Underground
        neon: {
          black: '#0a0a0f',
          pink: '#ff2a6d',
          cyan: '#05d9e8',
          purple: '#7b2dff',
        },
        // Design 3: Liquid Aurora
        aurora: {
          start: '#667eea',
          mid: '#764ba2',
          end: '#f093fb',
          glass: 'rgba(255,255,255,0.1)',
        },
        // Design 4: Neo Brutalism
        brutal: {
          bg: '#fffdf7',
          yellow: '#ffe135',
          red: '#ff3366',
          black: '#1a1a1a',
        },
        // Design 5: Cosmos Data
        cosmos: {
          void: '#0b0c1a',
          gold: '#ffd700',
          nebula: '#4a1f6e',
          star: '#f8f8ff',
        },
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glitch': 'glitch 0.3s ease-in-out',
        'twinkle': 'twinkle 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.3)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'glitch': {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        'twinkle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
      boxShadow: {
        'brutal': '8px 8px 0px 0px #1a1a1a',
        'brutal-sm': '4px 4px 0px 0px #1a1a1a',
        'neon-pink': '0 0 20px rgba(255, 42, 109, 0.5)',
        'neon-cyan': '0 0 20px rgba(5, 217, 232, 0.5)',
      },
    },
  },
  plugins: [],
}
