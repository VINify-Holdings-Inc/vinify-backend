import { User } from "../../Entities/user";
import { Login } from "../../Entities/login";
import { ContactUs } from "../../Entities/ContactUs";
import {
  deleteClosedAccountsPastRetention,
  deleteExpiredContactUsSubmissions,
} from "../DataRetentionCronJob";

jest.mock("../../Entities/user", () => ({ User: { find: jest.fn(), delete: jest.fn() } }));
jest.mock("../../Entities/login", () => ({ Login: { delete: jest.fn() } }));
jest.mock("../../Entities/ContactUs", () => ({ ContactUs: { delete: jest.fn() } }));

describe("deleteClosedAccountsPastRetention", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes Login before User, for every account past the 90-day window", async () => {
    (User.find as jest.Mock).mockResolvedValue([{ userId: "a" }, { userId: "b" }]);
    const calls: string[] = [];
    (Login.delete as jest.Mock).mockImplementation(({ userId }) => calls.push(`login:${userId}`));
    (User.delete as jest.Mock).mockImplementation(({ userId }) => calls.push(`user:${userId}`));

    await deleteClosedAccountsPastRetention();

    expect(calls).toEqual(["login:a", "user:a", "login:b", "user:b"]);
  });

  it("does nothing when no accounts are past the retention window", async () => {
    (User.find as jest.Mock).mockResolvedValue([]);

    await deleteClosedAccountsPastRetention();

    expect(Login.delete).not.toHaveBeenCalled();
    expect(User.delete).not.toHaveBeenCalled();
  });

  it("queries using a cutoff 90 days in the past, not some other window", async () => {
    (User.find as jest.Mock).mockResolvedValue([]);

    await deleteClosedAccountsPastRetention();

    const arg = (User.find as jest.Mock).mock.calls[0][0];
    const cutoff: Date = arg.where.deactivatedAt._value ?? arg.where.deactivatedAt.value;
    const daysAgo = (Date.now() - cutoff.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysAgo).toBeGreaterThan(89.9);
    expect(daysAgo).toBeLessThan(90.1);
  });
});

describe("deleteExpiredContactUsSubmissions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes ContactUs submissions past the 2-year window", async () => {
    (ContactUs.delete as jest.Mock).mockResolvedValue({ affected: 3 });

    await deleteExpiredContactUsSubmissions();

    expect(ContactUs.delete).toHaveBeenCalledTimes(1);
    const arg = (ContactUs.delete as jest.Mock).mock.calls[0][0];
    const cutoff: Date = arg.createdAt._value ?? arg.createdAt.value;
    const daysAgo = (Date.now() - cutoff.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysAgo).toBeGreaterThan(729.9);
    expect(daysAgo).toBeLessThan(730.1);
  });

  it("does not throw when nothing is affected", async () => {
    (ContactUs.delete as jest.Mock).mockResolvedValue({ affected: 0 });
    await expect(deleteExpiredContactUsSubmissions()).resolves.toBeUndefined();
  });
});
