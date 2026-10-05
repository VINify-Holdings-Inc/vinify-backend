import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

// RDS rotates the master password into its own Secrets Manager secret. Reading
// it when a connection is opened (instead of once from .env at startup) means a
// rotation is picked up without a redeploy. Existing connections stay valid
// across a rotation; only new ones need the fresh value.
const CACHE_TTL_MS = 60_000;

type SecretReader = (secretId: string) => Promise<string>;

const defaultReader: SecretReader = async (secretId) => {
  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || "us-east-1",
  });
  const res = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
  return res.SecretString as string;
};

let reader: SecretReader = defaultReader;
let cached: { value: string; fetchedAt: number } | undefined;
let inFlight: Promise<string> | undefined;

export function getDbPassword(): Promise<string> {
  const secretId = process.env.DB_SECRET_ARN;
  // No secret configured (local dev): keep using the static env var.
  if (!secretId) return Promise.resolve(process.env.DB_PASSWORD as string);

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return Promise.resolve(cached.value);
  }
  if (inFlight) return inFlight;

  inFlight = reader(secretId)
    .then((secretString) => {
      const value = JSON.parse(secretString).password as string;
      cached = { value, fetchedAt: Date.now() };
      return value;
    })
    .catch((err) => {
      // Throttled/unreachable Secrets Manager: a stale password is better than
      // refusing every new connection.
      if (cached) return cached.value;
      throw err;
    })
    .finally(() => {
      inFlight = undefined;
    });
  return inFlight;
}

export function __setSecretReaderForTests(r?: SecretReader): void {
  reader = r ?? defaultReader;
  cached = undefined;
  inFlight = undefined;
}
