import bcrypt from "bcrypt";
import { Login } from "../../Entities/login";
import { User } from "../../Entities/user";
import { MESSAGES } from "../../helpers/constants";
import * as utils from "../../helpers/utils";

jest.mock("../../Entities/login", () => ({
  Login: { findOne: jest.fn(), update: jest.fn() },
}));
jest.mock("../../Entities/user", () => ({
  User: { findOne: jest.fn(), update: jest.fn() },
}));
jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "fake-jwt-token"),
}));
jest.mock("../../helpers/utils", () => ({
  ...jest.requireActual("../../helpers/utils"),
  profileCompletion: jest.fn(() => 100),
}));

import { LoginController, CloseAccount } from "../LoginController";

function mockRes() {
  return { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
}

const baseUser = {
  id: 1,
  userId: "u-1",
  firstName: "Test",
  lastName: "User",
  emailId: "test@example.com",
  deactivatedAt: null,
};

describe("LoginController", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns USER_NOT_FOUND when no login record exists", async () => {
    (Login.findOne as jest.Mock).mockResolvedValue(null);
    const res = mockRes();

    await LoginController({ body: { email: "x@x.com", password: "x" } } as any, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 404, message: MESSAGES.USER_NOT_FOUND, success: false })
    );
  });

  it("returns USER_NOT_FOUND when login exists but user record does not", async () => {
    (Login.findOne as jest.Mock).mockResolvedValue({ userId: "u-1", password: "$2b$10$hash" });
    (User.findOne as jest.Mock).mockResolvedValue(null);
    const res = mockRes();

    await LoginController({ body: { email: "x@x.com", password: "x" } } as any, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 404, message: MESSAGES.USER_NOT_FOUND })
    );
  });

  it("blocks login on a closed account even with correct credentials", async () => {
    (Login.findOne as jest.Mock).mockResolvedValue({ userId: "u-1", password: "$2b$10$hash" });
    (User.findOne as jest.Mock).mockResolvedValue({ ...baseUser, deactivatedAt: new Date() });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const res = mockRes();

    await LoginController({ body: { email: "x@x.com", password: "correct" } } as any, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 403, message: MESSAGES.ACCOUNT_CLOSED, success: false })
    );
  });

  it("rejects a wrong password against a bcrypt hash", async () => {
    (Login.findOne as jest.Mock).mockResolvedValue({ userId: "u-1", password: "$2b$10$hash" });
    (User.findOne as jest.Mock).mockResolvedValue(baseUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const res = mockRes();

    await LoginController({ body: { email: "x@x.com", password: "wrong" } } as any, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 401, message: MESSAGES.INVALID_CREDENTIALS })
    );
  });

  it("logs in successfully with a correct bcrypt password and returns a token", async () => {
    (Login.findOne as jest.Mock).mockResolvedValue({ userId: "u-1", password: "$2b$10$hash" });
    (User.findOne as jest.Mock).mockResolvedValue(baseUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const res = mockRes();

    await LoginController({ body: { email: "x@x.com", password: "correct" } } as any, res);

    const call = (res.json as jest.Mock).mock.calls[0][0];
    expect(call.code).toBe(200);
    expect(call.message).toBe(MESSAGES.LOGIN_SUCCESS);
    expect(call.data.token).toBe("fake-jwt-token");
  });

  it("upgrades a legacy plaintext password to bcrypt on successful login", async () => {
    (Login.findOne as jest.Mock).mockResolvedValue({ userId: "u-1", password: "plaintext-pw" });
    (User.findOne as jest.Mock).mockResolvedValue(baseUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue("$2b$10$newhash");
    const res = mockRes();

    await LoginController({ body: { email: "x@x.com", password: "plaintext-pw" } } as any, res);

    expect(Login.update).toHaveBeenCalledWith({ userId: "u-1" }, { password: "$2b$10$newhash" });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 200 }));
  });

  it("rejects a wrong legacy plaintext password without upgrading it", async () => {
    (Login.findOne as jest.Mock).mockResolvedValue({ userId: "u-1", password: "plaintext-pw" });
    (User.findOne as jest.Mock).mockResolvedValue(baseUser);
    const res = mockRes();

    await LoginController({ body: { email: "x@x.com", password: "wrong-pw" } } as any, res);

    expect(Login.update).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 401, message: MESSAGES.INVALID_CREDENTIALS })
    );
  });
});

describe("CloseAccount", () => {
  beforeEach(() => jest.clearAllMocks());

  it("requires an authenticated user id", async () => {
    const res = mockRes();
    await CloseAccount({ user: undefined } as any, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 400, success: false }));
  });

  it("returns USER_NOT_FOUND if the user does not exist", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    const res = mockRes();
    await CloseAccount({ user: { id: "u-1" } } as any, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 404, message: MESSAGES.USER_NOT_FOUND })
    );
  });

  it("rejects closing an already-closed account", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ userId: "u-1", deactivatedAt: new Date() });
    const res = mockRes();
    await CloseAccount({ user: { id: "u-1" } } as any, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 409, message: MESSAGES.ACCOUNT_ALREADY_CLOSED })
    );
    expect(User.update).not.toHaveBeenCalled();
  });

  it("closes an active account by setting deactivatedAt", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ userId: "u-1", deactivatedAt: null });
    const res = mockRes();
    await CloseAccount({ user: { id: "u-1" } } as any, res);

    expect(User.update).toHaveBeenCalledWith({ userId: "u-1" }, { deactivatedAt: expect.any(Date) });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 200, message: MESSAGES.ACCOUNT_CLOSE_SUCCESS })
    );
  });
});
