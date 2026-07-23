/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: [
    require("@tailwindcss/postcss")(),
    require("autoprefixer")({
      overrideBrowserslist: ["Chrome >= 81", "Android >= 4.4"],
    }),
    require("./scripts/postcss-legacy-css.cjs")(),
  ],
};
