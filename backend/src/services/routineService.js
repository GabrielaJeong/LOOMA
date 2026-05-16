const mongoose = require("mongoose");
const Patient = require("../models/Patient");
const Routine = require("../models/Routine");
const User = require("../models/User");

const DOT_COLORS = ["#F1A0A0", "#AADCA9", "#AFC7FF", "#F4D18D"];

function pickDotColor(seed) {
  const value = String(seed || "routine");
  const index =
    value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    DOT_COLORS.length;

  return DOT_COLORS[index];
}

function mapSubjectType(subjectType) {
  return subjectType === "본인" || subjectType === "self" ? "self" : "family";
}

function mapRelationship(subjectType, subjectName) {
  if (mapSubjectType(subjectType) === "self") {
    return null;
  }

  return subjectName || subjectType || "기타";
}

function mapGender(gender) {
  if (gender === "남성" || gender === "male") return "male";
  if (gender === "여성" || gender === "female") return "female";
  return "other";
}

function parseBirthDate(birthDate) {
  if (!birthDate) return null;

  const normalized = String(birthDate).replace(/\./g, "-");
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatBirthDate(date) {
  if (!date) return "";

  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
  }).format(new Date(date));
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

function buildPatientPayload(userId, routineContext) {
  return {
    userId,
    type: mapSubjectType(routineContext.subjectType),
    relationship: mapRelationship(
      routineContext.subjectType,
      routineContext.subjectName
    ),
    gender: mapGender(routineContext.gender),
    birthDate: parseBirthDate(routineContext.birthDate),
    height: parseMeasure(routineContext.heightCm),
    weight: parseMeasure(routineContext.weightKg),
    region: routineContext.region || null,
  };
}

async function getOrCreatePatient(userId, routineContext) {
  const patientPayload = buildPatientPayload(userId, routineContext);

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

  return patient;
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

function getSubjectType(patient) {
  if (!patient || patient.type === "self") {
    return "본인";
  }

  return patient.relationship || "기타";
}

function serializeRoutine(routine, patient) {
  const plainRoutine =
    typeof routine?.toObject === "function" ? routine.toObject() : routine;

  return {
    ...plainRoutine,
    dotColor: pickDotColor(plainRoutine?._id || plainRoutine?.diseaseName),
    meta: {
      subjectType: getSubjectType(patient),
      subjectName: getSubjectName(patient),
      gender: patient?.gender || "other",
      birthDate: formatBirthDate(patient?.birthDate),
      heightCm: patient?.height ? String(patient.height) : "",
      weightKg: patient?.weight ? String(patient.weight) : "",
    },
  };
}

async function createRoutineFromContext(routineContext, currentUser = null) {
  const diseaseName = String(routineContext?.diseaseName || "").trim();

  if (!diseaseName) {
    const error = new Error("기록할 질병명 또는 증상을 입력해 주세요.");
    error.status = 400;
    throw error;
  }

  const user = currentUser || (await getOrCreateLocalDemoUser());
  const patient = await getOrCreatePatient(user._id, routineContext);

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

  return { routine, patient };
}

async function loadRoutineWithPatient(
  routineId,
  { includeDeleted = false, userId = null } = {}
) {
  if (!mongoose.Types.ObjectId.isValid(routineId)) {
    return null;
  }

  const query = { _id: routineId };

  if (userId) {
    query.userId = userId;
  }

  if (!includeDeleted) {
    query.deletedAt = null;
  }

  const routine = await Routine.findOne(query);

  if (!routine) {
    return null;
  }

  const patient = await Patient.findById(routine.patientId);

  return { routine, patient };
}

module.exports = {
  createRoutineFromContext,
  getOrCreateLocalDemoUser,
  loadRoutineWithPatient,
  serializeRoutine,
};
