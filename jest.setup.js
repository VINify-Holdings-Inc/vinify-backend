// src/helpers/utils.ts requires ENCRYPTION_KEY at import time -- set a
// fixed test-only value (32 bytes hex, matching the format the real .env
// uses) so importing it in tests does not throw before any test runs.
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  "a3c8b8ff564ce2956a945bd1880ab8f22ba7c8cbfbca9d70aa2df5706c113f0e";
