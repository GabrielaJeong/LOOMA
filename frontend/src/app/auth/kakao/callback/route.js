import { NextResponse } from "next/server";

// Kakao OAuth 콜백 — code를 백엔드로 전달해 JWT 발급
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  // 실제 구현 시: 백엔드 /api/auth/kakao에 code 전달 → JWT 수신 → 스토어 저장
  return NextResponse.redirect(new URL("/", request.url));
}
