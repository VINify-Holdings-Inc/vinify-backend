import { getDbPassword, __setSecretReaderForTests } from "../dbPassword";

const secret = (password: string) => JSON.stringify({ username: "u", password });

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
    process.env.DB_PASSWORD = "from-env";
    const reader = jest.fn();
    __setSecretReaderForTests(reader);

    await expect(getDbPassword()).resolves.toBe("from-env");
    expect(reader).not.toHaveBeenCalled();
  });

  it("reads the password from the secret and caches it within the TTL", async () => {
    process.env.DB_SECRET_ARN = "arn:secret";
    const reader = jest.fn().mockResolvedValue(secret("p1"));
    __setSecretReaderForTests(reader);

    await expect(getDbPassword()).resolves.toBe("p1");
    await expect(getDbPassword()).resolves.toBe("p1");
    expect(reader).toHaveBeenCalledTimes(1);
    expect(reader).toHaveBeenCalledWith("arn:secret");
  });

  it("picks up a rotated password after the cache expires", async () => {
    process.env.DB_SECRET_ARN = "arn:secret";
    const reader = jest
      .fn()
      .mockResolvedValueOnce(secret("old"))
      .mockResolvedValueOnce(secret("rotated"));
    __setSecretReaderForTests(reader);

    await expect(getDbPassword()).resolves.toBe("old");
    jest.advanceTimersByTime(61_000);
    await expect(getDbPassword()).resolves.toBe("rotated");
    expect(reader).toHaveBeenCalledTimes(2);
  });

  it("shares one fetch between concurrent callers", async () => {
    process.env.DB_SECRET_ARN = "arn:secret";
    const reader = jest.fn().mockResolvedValue(secret("p1"));
    __setSecretReaderForTests(reader);

    await Promise.all([getDbPassword(), getDbPassword(), getDbPassword()]);
    expect(reader).toHaveBeenCalledTimes(1);
  });

  it("serves the last known password if a refresh fails", async () => {
    process.env.DB_SECRET_ARN = "arn:secret";
    const reader = jest
      .fn()
      .mockResolvedValueOnce(secret("known"))
      .mockRejectedValueOnce(new Error("throttled"));
    __setSecretReaderForTests(reader);

    await expect(getDbPassword()).resolves.toBe("known");
    jest.advanceTimersByTime(61_000);
    await expect(getDbPassword()).resolves.toBe("known");
  });

  it("throws if the first fetch fails and nothing is cached", async () => {
    process.env.DB_SECRET_ARN = "arn:secret";
    __setSecretReaderForTests(jest.fn().mockRejectedValue(new Error("denied")));

    await expect(getDbPassword()).rejects.toThrow("denied");
  });
});
