const express = require("express");
const router = express.Router();
const User = require("../models/User");
const {
  KAKAO_CLIENT_ID,
  KAKAO_CLIENT_SECRET,
  KAKAO_REDIRECT_URI,
} = require("../config/env");
const { issueAuthTokens, verifyRefreshToken } = require("../services/tokenService");

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

function serializeUser(user) {
  return {
    id: String(user._id),
    kakaoId: user.kakaoId,
    name: user.name || "",
    nickname: user.name || "",
    notifications: user.notifications,
    onboardingCompleted: user.onboardingCompleted,
  };
}

function buildFrontendCallbackUrl({ user, tokens }) {
  const callbackUrl = new URL("/auth/kakao/callback", FRONTEND_ORIGIN);
  callbackUrl.searchParams.set("accessToken", tokens.accessToken);
  callbackUrl.searchParams.set("refreshToken", tokens.refreshToken);
  callbackUrl.searchParams.set("userId", String(user._id));
  callbackUrl.searchParams.set("nickname", user.name || "");
  callbackUrl.searchParams.set(
    "onboardingCompleted",
    user.onboardingCompleted ? "true" : "false"
  );

  return callbackUrl.toString();
}

function buildKakaoAuthorizeUrl() {
  const authorizeUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", KAKAO_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", KAKAO_REDIRECT_URI);

  return authorizeUrl.toString();
}

async function requestKakaoToken(code) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: KAKAO_CLIENT_ID,
    redirect_uri: KAKAO_REDIRECT_URI,
    code,
  });

  if (KAKAO_CLIENT_SECRET) {
    body.set("client_secret", KAKAO_CLIENT_SECRET);
  }

  const response = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`카카오 토큰 요청 실패 (${response.status}): ${detail}`);
  }

  return response.json();
}

async function requestKakaoProfile(accessToken) {
  const response = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`카카오 사용자 정보 요청 실패 (${response.status}): ${detail}`);
  }

  return response.json();
}

async function findOrCreateKakaoUser(kakaoProfile) {
  const kakaoId = String(kakaoProfile.id);
  const kakaoNickname =
    kakaoProfile.kakao_account?.profile?.nickname ||
    kakaoProfile.properties?.nickname ||
    "";
  const existingUser = await User.findOne({ kakaoId });

  if (existingUser) {
    if (existingUser.deletedAt) {
      existingUser.deletedAt = null;
    }

    if (!existingUser.name && kakaoNickname) {
      existingUser.name = kakaoNickname;
    }

    await existingUser.save();
    return existingUser;
  }

  return User.create({
    kakaoId,
    name: kakaoNickname,
    terms: {
      service: true,
      privacy: true,
      age: true,
      marketing: false,
    },
    notifications: {
      push: true,
      event: true,
      sms: false,
      email: false,
    },
    onboardingCompleted: false,
  });
}

// GET /auth/kakao - 카카오 인가 화면으로 이동
router.get("/kakao", (req, res) => {
  return res.redirect(buildKakaoAuthorizeUrl());
});

// GET /auth/kakao/callback - 카카오 인가 코드 콜백
router.get("/kakao/callback", async (req, res, next) => {
  try {
    const { code, error, error_description: errorDescription } = req.query;

    if (error) {
      return res.redirect(
        `${FRONTEND_ORIGIN}/?error=${encodeURIComponent(
          errorDescription || error
        )}`
      );
    }

    if (!code) {
      return res.redirect(`${FRONTEND_ORIGIN}/?error=no_code`);
    }

    const kakaoToken = await requestKakaoToken(code);
    const kakaoProfile = await requestKakaoProfile(kakaoToken.access_token);
    const user = await findOrCreateKakaoUser(kakaoProfile);
    const tokens = issueAuthTokens(user);

    return res.redirect(buildFrontendCallbackUrl({ user, tokens }));
  } catch (errorObject) {
    return next(errorObject);
  }
});

// POST /auth/kakao - 테스트/프론트 직접 호출용
router.post("/kakao", async (req, res, next) => {
  try {
    const { code } = req.body || {};

    if (!code) {
      return res.status(400).json({ message: "카카오 인가 코드가 필요해요." });
    }

    const kakaoToken = await requestKakaoToken(code);
    const kakaoProfile = await requestKakaoProfile(kakaoToken.access_token);
    const user = await findOrCreateKakaoUser(kakaoProfile);
    const tokens = issueAuthTokens(user);

    return res.status(200).json({
      user: serializeUser(user),
      ...tokens,
    });
  } catch (errorObject) {
    return next(errorObject);
  }
});

// POST /auth/refresh - Access Token 갱신
router.post("/refresh", async (req, res, next) => {
  try {
    const payload = verifyRefreshToken(req.body?.refreshToken);

    if (!payload?.sub) {
      return res.status(401).json({ message: "다시 로그인해 주세요." });
    }

    const user = await User.findOne({
      _id: payload.sub,
      deletedAt: null,
    });

    if (!user) {
      return res.status(401).json({ message: "다시 로그인해 주세요." });
    }

    return res.status(200).json({
      user: serializeUser(user),
      ...issueAuthTokens(user),
    });
  } catch (errorObject) {
    return next(errorObject);
  }
});

// POST /auth/logout - MVP 앱 로그아웃
router.post("/logout", async (req, res) => {
  return res.status(200).json({ message: "로그아웃했어요." });
});

module.exports = router;
