import "@/styles/globals.css";

export const metadata = {
  title: "LOOMA",
  description: "음성으로 건강을 기록하는 서비스",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
