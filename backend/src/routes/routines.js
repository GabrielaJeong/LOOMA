const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

// GET /routines - 루틴 목록 조회
router.get("/", authenticate, async (req, res, next) => {});

// POST /routines - 루틴 생성
router.post("/", authenticate, async (req, res, next) => {});

// GET /routines/:routineId - 루틴 상세 조회
router.get("/:routineId", authenticate, async (req, res, next) => {});

// PUT /routines/:routineId - 루틴 수정
router.put("/:routineId", authenticate, async (req, res, next) => {});

// DELETE /routines/:routineId - 루틴 삭제 (soft delete)
router.delete("/:routineId", authenticate, async (req, res, next) => {});

module.exports = router;
