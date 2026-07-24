import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVITY_RETENTION_DAYS,
  activityRetentionCutoff,
} from "../functions/lib/activity-retention.js";

test("activity retention uses a rolling 30-day window", () => {
  const now = new Date("2026-07-24T15:30:00.000Z");

  assert.equal(ACTIVITY_RETENTION_DAYS, 30);
  assert.equal(
    activityRetentionCutoff(now),
    "2026-06-24T15:30:00.000Z",
  );
});

test("activity retention accepts numeric timestamps", () => {
  const now = Date.parse("2026-07-24T15:30:00.000Z");

  assert.equal(
    activityRetentionCutoff(now),
    "2026-06-24T15:30:00.000Z",
  );
});
