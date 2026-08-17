// src/helpers/utils.ts requires ENCRYPTION_KEY at import time -- set a
// throwaway value (32 bytes hex, matching the format the real .env uses)
// so importing it in tests does not throw before any test runs. Generated
// fresh each run, not hardcoded, since tests only round-trip
// encrypt/decrypt within a single process and never need it to be stable
// across runs.
const crypto = require("crypto");
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
