const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const Routine = require("../models/Routine");
const Patient = require("../models/Patient");
const {
  createRoutineFromContext,
  getOrCreateLocalDemoUser,
  loadRoutineWithPatient,
  serializeRoutine,
} = require("../services/routineService");

async function serializeRoutineList(routines) {
  return Promise.all(
    routines.map(async (routine) => {
      const patient = await Patient.findById(routine.patientId);
      return serializeRoutine(routine, patient);
    })
  );
}

// GET /routines - 루틴 목록 조회
router.get("/", authenticate, async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateLocalDemoUser());
    const routines = await Routine.find({
      userId: user._id,
      deletedAt: null,
    }).sort({ createdAt: -1 });
    const serializedRoutines = await serializeRoutineList(routines);

    return res.status(200).json({
      routines: serializedRoutines,
    });
  } catch (error) {
    return next(error);
  }
});

// POST /routines - 루틴 생성
router.post("/", authenticate, async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateLocalDemoUser());
    const { routine, patient } = await createRoutineFromContext(
      req.body || {},
      user
    );

    return res.status(201).json({
      message: "루틴을 만들었어요.",
      routine: serializeRoutine(routine, patient),
    });
  } catch (error) {
    return next(error);
  }
});

// GET /routines/:routineId - 루틴 상세 조회
router.get("/:routineId", authenticate, async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateLocalDemoUser());
    const loaded = await loadRoutineWithPatient(req.params.routineId, {
      userId: user._id,
    });

    if (!loaded) {
      return res.status(404).json({
        message: "루틴을 찾을 수 없어요.",
      });
    }

    return res.status(200).json({
      routine: serializeRoutine(loaded.routine, loaded.patient),
    });
  } catch (error) {
    return next(error);
  }
});

async function updateRoutineName(req, res, next) {
  try {
    const nextName = String(req.body?.diseaseName || req.body?.name || "").trim();

    if (!nextName) {
      return res.status(400).json({
        message: "변경할 루틴명을 입력해 주세요.",
      });
    }

    const user = req.user || (await getOrCreateLocalDemoUser());
    const loaded = await loadRoutineWithPatient(req.params.routineId, {
      userId: user._id,
    });

    if (!loaded) {
      return res.status(404).json({
        message: "수정할 루틴을 찾을 수 없어요.",
      });
    }

    loaded.routine.name = nextName;
    loaded.routine.diseaseName = nextName;
    await loaded.routine.save();

    return res.status(200).json({
      message: "루틴명을 변경했어요.",
      routine: serializeRoutine(loaded.routine, loaded.patient),
    });
  } catch (error) {
    return next(error);
  }
}

// PATCH /routines/:routineId - 루틴명 변경
router.patch("/:routineId", authenticate, updateRoutineName);

// PUT도 같은 동작으로 유지해서 기존 호출이 생겨도 깨지지 않게 둔다.
router.put("/:routineId", authenticate, updateRoutineName);

// DELETE /routines/:routineId - 루틴 삭제 (soft delete)
router.delete("/:routineId", authenticate, async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateLocalDemoUser());
    const loaded = await loadRoutineWithPatient(req.params.routineId, {
      userId: user._id,
    });

    if (!loaded) {
      return res.status(404).json({
        message: "삭제할 루틴을 찾을 수 없어요.",
      });
    }

    loaded.routine.deletedAt = new Date();
    await loaded.routine.save();

    return res.status(200).json({
      message: "루틴을 삭제했어요.",
      routineId: req.params.routineId,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
