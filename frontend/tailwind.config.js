/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        kakao: "#FEE500",
        primary: {
          DEFAULT: "#5570F1",
          50: "#EEF1FD",
          100: "#D4DBFA",
          500: "#5570F1",
          600: "#3F57E8",
          700: "#2D44D5",
        },
        gray: {
          50: "#F8F9FA",
          100: "#F1F3F5",
          200: "#E9ECEF",
          300: "#DEE2E6",
          400: "#CED4DA",
          500: "#ADB5BD",
          600: "#868E96",
          700: "#495057",
          800: "#343A40",
          900: "#212529",
        },
        surface: "#F5F7FF",
      },
      maxWidth: {
        mobile: "420px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Pretendard",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: ["12px", "1.4"],
        sm: ["13px", "1.5"],
        base: ["14px", "1.6"],
        md: ["15px", "1.6"],
        lg: ["16px", "1.5"],
        xl: ["18px", "1.4"],
        "2xl": ["20px", "1.3"],
        "3xl": ["24px", "1.2"],
      },
      spacing: {
        safe: "env(safe-area-inset-bottom)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.08)",
        modal: "0 8px 32px rgba(0,0,0,0.16)",
        bottom: "0 -1px 0 rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
