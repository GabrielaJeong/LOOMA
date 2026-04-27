import "@/styles/globals.css";

export const metadata = {
  title: "LOOMA",
  description: "건강 기록을 더 쉽게 이어가는 LOOMA",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
