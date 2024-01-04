/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: "#DDA15E",
        secondary: "#BC6C25",
        third: "#FEFAE0",
        fourth: "#283618",
        fifth: "#606C38",
        sixth: "#F0653F",
      },
      fontFamily: {
        raleway: "Raleway",
      },
      boxShadow: {
        buttonShadow: "3px 3px black",
        slideShadow: "1px 1px black",
      },
      borderRadius: {
        teamSettings: "25px 0",
        teamSettingsSelected: "0 25px",
      },
      backgroundColor: {
        transparentDisplay: "rgb(0,0,0, 0.7)",
      },
      keyframes: {
        "top-come": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0px)" },
        },
        "right-come": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0px)" },
        },
        "left-come": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0px)" },
        },
        fadein: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        turn: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "top-come": "top-come 1s ease",
        "right-come": "right-come 1s ease",
        "left-come": "left-come 1s ease",
        fadein: "fadein 3s ease-in 3s forwards",
        fadein0: "fadein 2s ease-in 5s forwards",
        fadein1: "fadein 2s ease-in 4s forwards",
        fadein2: "fadein 2s ease-in 3s forwards",
        turn: "turn 10s linear infinite",
      },
    },
  },
  plugins: [],
};

