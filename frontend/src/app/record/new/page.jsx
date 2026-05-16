import { Suspense } from "react";

import NewRecordFlow from "@/components/record/NewRecordFlow";

export default function NewRecordPage({ searchParams }) {
  return (
    <Suspense fallback={null}>
      <NewRecordFlow routineId={searchParams?.routineId ?? null} />
    </Suspense>
  );
}
