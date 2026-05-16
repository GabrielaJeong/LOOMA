const crypto = require("crypto");
const {
  JWT_ACCESS_EXPIRES,
  JWT_REFRESH_EXPIRES,
  JWT_REFRESH_SECRET,
  JWT_SECRET,
} = require("../config/env");

function base64UrlFromString(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlEncode(value) {
  return base64UrlFromString(JSON.stringify(value));
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );

  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

function parseExpiresIn(value) {
  const match = /^(\d+)([smhd])?$/.exec(String(value || ""));

  if (!match) {
    return 60 * 60;
  }

  const amount = Number(match[1]);
  const unit = match[2] || "s";
  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };

  return amount * multipliers[unit];
}

function signToken(payload, secret, expiresIn) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + parseExpiresIn(expiresIn),
  };
  const unsigned = `${base64UrlEncode(header)}.${base64UrlEncode(body)}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(unsigned)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${unsigned}.${signature}`;
}

function verifyToken(token, secret) {
  const [header, payload, signature] = String(token || "").split(".");

  if (!header || !payload || !signature) {
    return null;
  }

  const unsigned = `${header}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(unsigned)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    return null;
  }

  const decoded = base64UrlDecode(payload);
  const now = Math.floor(Date.now() / 1000);

  if (decoded.exp && decoded.exp < now) {
    return null;
  }

  return decoded;
}

function issueAuthTokens(user) {
  const payload = {
    sub: String(user._id),
    kakaoId: user.kakaoId,
  };

  return {
    accessToken: signToken(payload, JWT_SECRET, JWT_ACCESS_EXPIRES),
    refreshToken: signToken(payload, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES),
  };
}

module.exports = {
  issueAuthTokens,
  verifyAccessToken: (token) => verifyToken(token, JWT_SECRET),
  verifyRefreshToken: (token) => verifyToken(token, JWT_REFRESH_SECRET),
};
