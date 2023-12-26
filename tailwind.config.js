/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}"],
  theme: {
    extend: {
      boxShadow: {
        buttonShadow: "3px 3px black",
        slideShadow: "1px 1px black",
      },
      borderRadius: {
        teamSettings: "25px 0",
      },
    },
  },
  plugins: [],
};

