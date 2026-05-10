/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Основная палитра
        primary: {
          DEFAULT: '#84d2c5', // Основной акцент (бывший синий)
          light: '#a6e0d7',   // Светлый оттенок для hover/focus
          dark: '#5bb8a8',    // Темный оттенок для текста на primary-фоне
        },
        accent: {
          DEFAULT: '#e4c988', // Дополнительный акцент (золотистый)
        },
        secondary: {
          DEFAULT: '#c27765', // Теплый контрастный (розово-коричневый)
        },
        highlight: {
          DEFAULT: '#b05b7b', // Яркий акцентный (розовый)
        },
        
        // Фон страницы
        background: '#ffffe8',

        // Статусы и бейджи (с твоими HEX-кодами)
        status: {
          success: {
            bg: '#DCFCE7',
            text: '#166534',
          },
          warning: {
            bg: '#FEF9C3',
            text: '#854D0E',
          },
          error: {
            bg: '#FEE2E2',
            text: '#991B1B',
          },
          info: {
            bg: '#DBEAFE',
            text: '#1E40AF',
          },
          neutral: {
            bg: '#F3F4F6',
            text: '#1F2937',
          },
        },
      },
    },
  },
  plugins: [],
}
