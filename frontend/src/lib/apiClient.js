// API 클라이언트
// 기본 URL 설정, 요청 인터셉터 (JWT 헤더 주입), 응답 인터셉터 (토큰 갱신)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiClient = {
  get: async (path, options = {}) => {},
  post: async (path, body, options = {}) => {},
  put: async (path, body, options = {}) => {},
  patch: async (path, body, options = {}) => {},
  delete: async (path, options = {}) => {},
};
