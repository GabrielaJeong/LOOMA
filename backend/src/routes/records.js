const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { authenticate } = require("../middleware/auth");
const Record = require("../models/Record");
const Routine = require("../models/Routine");
const Patient = require("../models/Patient");
const User = require("../models/User");
const { structureRecord } = require("../services/claudeService");
const {
  validateCreateRecordBody,
  validateUpdateRecordBody,
} = require("../services/structuredRecordSchema");

function getTodayDateInSeoul() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
  }).format(new Date());
}

function mapSubjectType(subjectType) {
  return subjectType === "본인" ? "self" : "family";
}

function mapRelationship(subjectType, subjectName) {
  if (subjectType === "본인") {
    return null;
  }

  return subjectName || subjectType || "기타";
}

function mapGender(gender) {
  if (gender === "남성") return "male";
  if (gender === "여성") return "female";
  return "other";
}

function parseBirthDate(birthDate) {
  if (!birthDate) return null;

  const normalized = birthDate.replace(/\./g, "-");
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseMeasure(value) {
  if (!value) return null;
  const onlyNumbers = String(value).replace(/\D/g, "");
  return onlyNumbers ? Number(onlyNumbers) : null;
}

async function getOrCreateLocalDemoUser() {
  const existingUser = await User.findOne({
    kakaoId: "local-demo-user",
    deletedAt: null,
  });

  if (existingUser) {
    return existingUser;
  }

  return User.create({
    kakaoId: "local-demo-user",
    name: "LOOMA 로컬 테스트 유저",
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
    onboardingCompleted: true,
  });
}

async function resolveRoutine({ routineId, routineContext, user }) {
  if (routineId && mongoose.Types.ObjectId.isValid(routineId)) {
    const existingRoutine = await Routine.findOne({
      _id: routineId,
      userId: user._id,
      deletedAt: null,
    });

    if (existingRoutine) {
      return existingRoutine;
    }
  }

  if (!routineContext) {
    return null;
  }

  const patientPayload = {
    userId: user._id,
    type: mapSubjectType(routineContext.subjectType),
    relationship: mapRelationship(routineContext.subjectType, routineContext.subjectName),
    gender: mapGender(routineContext.gender),
    birthDate: parseBirthDate(routineContext.birthDate),
    height: parseMeasure(routineContext.heightCm),
    weight: parseMeasure(routineContext.weightKg),
    region: null,
  };

  let patient = await Patient.findOne({
    userId: patientPayload.userId,
    type: patientPayload.type,
    relationship: patientPayload.relationship,
    gender: patientPayload.gender,
    birthDate: patientPayload.birthDate,
    height: patientPayload.height,
    weight: patientPayload.weight,
  });

  if (!patient) {
    patient = await Patient.create(patientPayload);
  }

  const diseaseName = routineContext.diseaseName || "기록 루틴";
  let routine = await Routine.findOne({
    userId: user._id,
    patientId: patient._id,
    diseaseName,
    deletedAt: null,
  });

  if (!routine) {
    routine = await Routine.create({
      userId: user._id,
      patientId: patient._id,
      name: diseaseName,
      diseaseName,
    });
  }

  return routine;
}

function getSubjectName(patient) {
  if (!patient) {
    return "본인";
  }

  if (patient.type === "self" || !patient.relationship) {
    return "본인";
  }

  return patient.relationship;
}

function serializeRecord(record, routine, patient) {
  const plainRecord =
    typeof record?.toObject === "function" ? record.toObject() : record;

  return {
    ...plainRecord,
    meta: {
      diseaseName: routine?.diseaseName || routine?.name || "",
      subjectName: getSubjectName(patient),
    },
  };
}

async function loadRecordWithContext(recordId, user) {
  if (!mongoose.Types.ObjectId.isValid(recordId)) {
    return null;
  }

  const record = await Record.findOne({
    _id: recordId,
    userId: user._id,
  });

  if (!record) {
    return null;
  }

  const routine = await Routine.findById(record.routineId);

  const patient = routine
    ? await Patient.findById(routine.patientId)
    : null;

  return { record, routine, patient };
}

async function serializeRecords(records) {
  return Promise.all(
    records.map(async (record) => {
      const routine = await Routine.findById(record.routineId);
      const patient = routine
        ? await Patient.findById(routine.patientId)
        : null;

      return serializeRecord(record, routine, patient);
    })
  );
}

function getMonthBounds(year, month) {
  const normalizedYear = Number(year);
  const normalizedMonth = Number(month);

  if (
    !Number.isInteger(normalizedYear) ||
    !Number.isInteger(normalizedMonth) ||
    normalizedMonth < 1 ||
    normalizedMonth > 12
  ) {
    return null;
  }

  const start = `${normalizedYear}-${String(normalizedMonth).padStart(2, "0")}-01`;
  const endDate = new Date(Date.UTC(normalizedYear, normalizedMonth, 0));
  const end = `${normalizedYear}-${String(normalizedMonth).padStart(2, "0")}-${String(
    endDate.getUTCDate()
  ).padStart(2, "0")}`;

  return { start, end };
}

// GET /records - 기록 목록 조회 (날짜 필터)
router.get("/", authenticate, async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateLocalDemoUser());
    const date = req.query.date || getTodayDateInSeoul();
    const records = await Record.find({ userId: user._id, date })
      .sort({ createdAt: -1 })
      .limit(50);
    const serializedRecords = await serializeRecords(records);

    return res.status(200).json({
      date,
      records: serializedRecords,
    });
  } catch (error) {
    return next(error);
  }
});

// GET /records/calendar?year=&month= - 캘린더용 기록 존재 날짜 조회
router.get("/calendar", authenticate, async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateLocalDemoUser());
    const bounds = getMonthBounds(req.query.year, req.query.month);

    if (!bounds) {
      return res.status(400).json({
        message: "조회할 연도와 월을 확인해 주세요.",
      });
    }

    const records = await Record.find({
      userId: user._id,
      date: {
        $gte: bounds.start,
        $lte: bounds.end,
      },
    }).select("date");
    const dates = [...new Set(records.map((record) => record.date))].sort();

    return res.status(200).json({
      year: Number(req.query.year),
      month: Number(req.query.month),
      dates,
    });
  } catch (error) {
    return next(error);
  }
});

// POST /records - 기록 생성 (MVP 1차: 텍스트 입력 → AI 구조화 → 저장)
router.post("/", authenticate, async (req, res, next) => {
  try {
    const validatedBody = validateCreateRecordBody(req.body);

    if (!validatedBody.success) {
      return res.status(400).json({
        message: validatedBody.error,
      });
    }

    const user = req.user || (await getOrCreateLocalDemoUser());
    const { routineId, transcript, date, routineContext } = validatedBody.data;
    const routine = await resolveRoutine({
      routineId,
      routineContext,
      user,
    });

    if (!routine) {
      return res.status(404).json({
        message: "기록할 루틴을 찾지 못했어요.",
      });
    }

    const structured = await structureRecord(transcript, routine);
    const record = await Record.create({
      userId: routine.userId,
      routineId: routine._id,
      date: date || getTodayDateInSeoul(),
      sections: structured.sections,
      summary: structured.summary,
      notes: structured.notes,
    });
    const patient = await Patient.findById(routine.patientId);

    return res.status(201).json({
      message: "기록을 저장했어요.",
      record: serializeRecord(record, routine, patient),
    });
  } catch (error) {
    return next(error);
  }
});

// GET /records/:recordId - 기록 상세 조회
router.get("/:recordId", authenticate, async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateLocalDemoUser());
    const loaded = await loadRecordWithContext(req.params.recordId, user);

    if (!loaded) {
      return res.status(404).json({
        message: "기록을 찾을 수 없어요.",
      });
    }

    return res.status(200).json({
      record: serializeRecord(loaded.record, loaded.routine, loaded.patient),
    });
  } catch (error) {
    return next(error);
  }
});

// PUT /records/:recordId - 기록 수정
router.put("/:recordId", authenticate, async (req, res, next) => {
  try {
    const validatedBody = validateUpdateRecordBody(req.body);

    if (!validatedBody.success) {
      return res.status(400).json({
        message: validatedBody.error,
      });
    }

    const user = req.user || (await getOrCreateLocalDemoUser());
    const loaded = await loadRecordWithContext(req.params.recordId, user);

    if (!loaded) {
      return res.status(404).json({
        message: "수정할 기록을 찾을 수 없어요.",
      });
    }

    loaded.record.sections = validatedBody.data.sections;
    await loaded.record.save();

    return res.status(200).json({
      message: "기록을 수정했어요.",
      record: serializeRecord(loaded.record, loaded.routine, loaded.patient),
    });
  } catch (error) {
    return next(error);
  }
});

// DELETE /records/:recordId - 기록 삭제
router.delete("/:recordId", authenticate, async (req, res, next) => {
  try {
    const user = req.user || (await getOrCreateLocalDemoUser());
    const loaded = await loadRecordWithContext(req.params.recordId, user);

    if (!loaded) {
      return res.status(404).json({
        message: "삭제할 기록을 찾을 수 없어요.",
      });
    }

    await Record.deleteOne({ _id: loaded.record._id });

    return res.status(200).json({
      message: "기록을 삭제했어요.",
      recordId: req.params.recordId,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
