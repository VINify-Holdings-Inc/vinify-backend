// src/helpers/utils.ts requires ENCRYPTION_KEY at import time -- set a
// fixed test-only value (32 bytes hex, matching the format the real .env
// uses) so importing it in tests does not throw before any test runs.
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  "REDACTED-TEST-KEY";
