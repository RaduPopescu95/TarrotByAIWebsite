/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
 
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      primary: '#000000',
      secondary:"#252525",
      accent:"#eab308",
      transparent:"transparent",
      "white":"white"
    },
    
    extend: {
      fontSize: {
        'firstHeader': '40px',
        'paragraf': '20px'

      },

    },
  },
  plugins: [],
}