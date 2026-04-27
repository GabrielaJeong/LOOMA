import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터 — accessToken 자동 주입
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const raw = sessionStorage.getItem("auth-storage");
    if (raw) {
      try {
        const { state } = JSON.parse(raw);
        const token = state?.accessToken;
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {
        // 파싱 실패 시 토큰 없이 전송
      }
    }
  }
  return config;
});

// 응답 인터셉터 — 401 시 로그아웃
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      sessionStorage.removeItem("auth-storage");
      window.location.href = "/";
    }
    const message =
      error.response?.data?.message || "서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요.";
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
