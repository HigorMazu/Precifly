export function logInfo(msg: string, meta?: Record<string, unknown>) {
  console.log(`[INFO] ${msg}`, meta ? JSON.stringify(meta) : "");
}
export function logError(msg: string, err?: unknown) {
  console.error(`[ERROR] ${msg}`, err);
}
export function logJob(msg: string, meta?: Record<string, unknown>) {
  console.log(`[JOB] ${msg}`, meta ? JSON.stringify(meta) : "");
}
