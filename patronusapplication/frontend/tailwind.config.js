const withMT = require("@material-tailwind/react/utils/withMT");
 
module.exports = withMT({
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blue: {
          '600': '#1e88e5',
          '700': '#147efb',
        },
      },
    },
  },
  plugins: [],
});
