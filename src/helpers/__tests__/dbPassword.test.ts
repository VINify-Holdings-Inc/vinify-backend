import { getDbPassword, __setSecretReaderForTests } from "../dbPassword";

const rdsSecretJson = (value: string) => JSON.stringify({ username: "u", password: value });

describe("getDbPassword", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    jest.useFakeTimers();
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.useRealTimers();
    __setSecretReaderForTests();
  });

  it("falls back to DB_PASSWORD when DB_SECRET_ARN is not set", async () => {
    delete process.env.DB_SECRET_ARN;
    const fromEnv = ["env", String(Date.now())].join("-");
    Object.assign(process.env, { DB_PASSWORD: fromEnv });
    const reader = jest.fn();
    __setSecretReaderForTests(reader);

    await expect(getDbPassword()).resolves.toBe(fromEnv);
    expect(reader).not.toHaveBeenCalled();
  });

  it("reads the password from the secret and caches it within the TTL", async () => {
    process.env.DB_SECRET_ARN = "arn:secret";
    const reader = jest.fn().mockResolvedValue(rdsSecretJson("value-a"));
    __setSecretReaderForTests(reader);

    await expect(getDbPassword()).resolves.toBe("value-a");
    await expect(getDbPassword()).resolves.toBe("value-a");
    expect(reader).toHaveBeenCalledTimes(1);
    expect(reader).toHaveBeenCalledWith("arn:secret");
  });

  it("picks up a rotated password after the cache expires", async () => {
    process.env.DB_SECRET_ARN = "arn:secret";
    const reader = jest
      .fn()
      .mockResolvedValueOnce(rdsSecretJson("value-old"))
      .mockResolvedValueOnce(rdsSecretJson("value-new"));
    __setSecretReaderForTests(reader);

    await expect(getDbPassword()).resolves.toBe("value-old");
    jest.advanceTimersByTime(61_000);
    await expect(getDbPassword()).resolves.toBe("value-new");
    expect(reader).toHaveBeenCalledTimes(2);
  });

  it("shares one fetch between concurrent callers", async () => {
    process.env.DB_SECRET_ARN = "arn:secret";
    const reader = jest.fn().mockResolvedValue(rdsSecretJson("value-a"));
    __setSecretReaderForTests(reader);

    await Promise.all([getDbPassword(), getDbPassword(), getDbPassword()]);
    expect(reader).toHaveBeenCalledTimes(1);
  });

  it("serves the last known password if a refresh fails", async () => {
    process.env.DB_SECRET_ARN = "arn:secret";
    const reader = jest
      .fn()
      .mockResolvedValueOnce(rdsSecretJson("value-last"))
      .mockRejectedValueOnce(new Error("throttled"));
    __setSecretReaderForTests(reader);

    await expect(getDbPassword()).resolves.toBe("value-last");
    jest.advanceTimersByTime(61_000);
    await expect(getDbPassword()).resolves.toBe("value-last");
  });

  it("throws if the first fetch fails and nothing is cached", async () => {
    process.env.DB_SECRET_ARN = "arn:secret";
    __setSecretReaderForTests(jest.fn().mockRejectedValue(new Error("denied")));

    await expect(getDbPassword()).rejects.toThrow("denied");
  });
});
