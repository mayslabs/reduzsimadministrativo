export const ACTIVITY_RETENTION_DAYS = 30;

export function activityRetentionCutoff(now = Date.now()) {
  const timestamp = now instanceof Date ? now.getTime() : Number(now);
  const safeTimestamp = Number.isFinite(timestamp) ? timestamp : Date.now();
  return new Date(
    safeTimestamp - ACTIVITY_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}
