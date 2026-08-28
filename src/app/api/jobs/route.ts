import { NextResponse } from "next/server";
import { runAllJobs } from "@/jobs/runner";

export async function POST() {
  // não bloqueia? mas para MVP executa inline
  await runAllJobs();
  return NextResponse.json({ success: true });
}
