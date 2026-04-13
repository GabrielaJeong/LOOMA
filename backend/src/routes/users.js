const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

// GET /users/me - 내 정보 조회
router.get("/me", authenticate, async (req, res, next) => {});

// PATCH /users/me - 내 정보 수정
router.patch("/me", authenticate, async (req, res, next) => {});

// DELETE /users/me - 회원 탈퇴 (soft delete)
router.delete("/me", authenticate, async (req, res, next) => {});

// GET /users/me/patients - 내 환자 목록 조회
router.get("/me/patients", authenticate, async (req, res, next) => {});

// POST /users/me/patients - 환자 등록
router.post("/me/patients", authenticate, async (req, res, next) => {});

// PATCH /users/me/patients/:patientId - 환자 정보 수정
router.patch("/me/patients/:patientId", authenticate, async (req, res, next) => {});

// PATCH /users/me/notifications - 알림 설정 수정
router.patch("/me/notifications", authenticate, async (req, res, next) => {});

module.exports = router;
