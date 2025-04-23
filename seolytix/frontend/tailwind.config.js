/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Dunkles Theme-Farbschema
                'bg-dark': '#2B2E3B',
                'bg-darker': '#252830',
                'card-bg': '#343845',
                'accent-blue': '#688db1',
                'accent-green': '#9cb68f',
                'accent-red': '#e16162',
                'text-primary': '#d1d5db',
                'text-secondary': '#9ca3af',
                // Behalte die ursprüngliche primäre Farbe bei
                'primary': '#2C2E3B',
            },
            fontFamily: {
                'sans': [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"Segoe UI"',
                    'Roboto',
                    'Oxygen',
                    'Ubuntu',
                    'Cantarell',
                    '"Fira Sans"',
                    '"Droid Sans"',
                    '"Helvetica Neue"',
                    'sans-serif'
                ],
            },
            borderRadius: {
                'xl': '1rem',
            },
            boxShadow: {
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            },
        },
    },
    plugins: [],
}