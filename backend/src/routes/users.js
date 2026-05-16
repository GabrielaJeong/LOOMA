const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const Record = require("../models/Record");
const User = require("../models/User");
const { getOrCreateLocalDemoUser } = require("../services/routineService");

function serializeUser(user, stats = {}) {
  return {
    id: String(user._id),
    kakaoId: user.kakaoId,
    name: user.name || "",
    nickname: user.name || "",
    phone: user.phone || "",
    notifications: user.notifications,
    onboardingCompleted: user.onboardingCompleted,
    recordDayCount: stats.recordDayCount || 0,
  };
}

async function getCurrentUser(req) {
  if (req.user) {
    return req.user;
  }

  return getOrCreateLocalDemoUser();
}

async function getUserStats(userId) {
  const dates = await Record.distinct("date", { userId });

  return {
    recordDayCount: dates.length,
  };
}

// GET /users/me - 내 정보 조회
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const stats = await getUserStats(user._id);

    return res.status(200).json({
      user: serializeUser(user, stats),
    });
  } catch (error) {
    return next(error);
  }
});

// PATCH /users/me - 내 정보 수정
router.patch("/me", authenticate, async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const nextName = req.body?.name ?? req.body?.nickname;

    if (typeof nextName === "string") {
      const trimmedName = nextName.trim().slice(0, 20);

      if (!trimmedName) {
        return res.status(400).json({ message: "이름을 입력해 주세요." });
      }

      user.name = trimmedName;
    }

    if (typeof req.body?.onboardingCompleted === "boolean") {
      user.onboardingCompleted = req.body.onboardingCompleted;
    }

    await user.save();

    return res.status(200).json({
      message: "내 정보를 변경했어요.",
      user: serializeUser(user, await getUserStats(user._id)),
    });
  } catch (error) {
    return next(error);
  }
});

// DELETE /users/me - 회원 탈퇴 (soft delete)
router.delete("/me", authenticate, async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);

    user.deletedAt = new Date();
    await user.save();

    return res.status(200).json({
      message: "회원 탈퇴가 완료됐어요.",
    });
  } catch (error) {
    return next(error);
  }
});

// GET /users/me/patients - 이후 환자 목록에서 구현
router.get("/me/patients", authenticate, async (req, res) => {
  return res.status(200).json({ patients: [] });
});

// POST /users/me/patients - 이후 환자 등록에서 구현
router.post("/me/patients", authenticate, async (req, res) => {
  return res.status(501).json({ message: "아직 지원하지 않는 기능이에요." });
});

// PATCH /users/me/patients/:patientId - 이후 환자 수정에서 구현
router.patch("/me/patients/:patientId", authenticate, async (req, res) => {
  return res.status(501).json({ message: "아직 지원하지 않는 기능이에요." });
});

// PATCH /users/me/notifications - 알림 설정 수정
router.patch("/me/notifications", authenticate, async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const nextNotifications = req.body?.notifications || req.body || {};

    user.notifications = {
      push:
        typeof nextNotifications.push === "boolean"
          ? nextNotifications.push
          : user.notifications.push,
      event:
        typeof nextNotifications.event === "boolean"
          ? nextNotifications.event
          : user.notifications.event,
      sms:
        typeof nextNotifications.sms === "boolean"
          ? nextNotifications.sms
          : user.notifications.sms,
      email:
        typeof nextNotifications.email === "boolean"
          ? nextNotifications.email
          : user.notifications.email,
    };

    await user.save();

    return res.status(200).json({
      message: "알림 설정을 변경했어요.",
      user: serializeUser(user, await getUserStats(user._id)),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
