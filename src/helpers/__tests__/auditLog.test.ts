import { auditLog } from "../auditLog";

describe("auditLog", () => {
  it("logs a structured, parseable record with all required fields", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    auditLog({ userId: "u-1", eventType: "login", outcome: "success", resource: "Login" });

    expect(spy).toHaveBeenCalledTimes(1);
    const line: string = spy.mock.calls[0][0];
    expect(line.startsWith("AUDIT ")).toBe(true);

    const record = JSON.parse(line.slice("AUDIT ".length));
    expect(record.userId).toBe("u-1");
    expect(record.eventType).toBe("login");
    expect(record.outcome).toBe("success");
    expect(record.resource).toBe("Login");
    expect(new Date(record.timestamp).toString()).not.toBe("Invalid Date");

    spy.mockRestore();
  });

  it("includes userId: null for events with no authenticated identity", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    auditLog({ userId: null, eventType: "login", outcome: "failure", resource: "Login", detail: "no such account" });

    const record = JSON.parse((spy.mock.calls[0][0] as string).slice("AUDIT ".length));
    expect(record.userId).toBeNull();
    expect(record.detail).toBe("no such account");

    spy.mockRestore();
  });

  it("omits the detail field entirely when not provided", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    auditLog({ userId: "u-1", eventType: "account-closure", outcome: "success", resource: "User" });

    const record = JSON.parse((spy.mock.calls[0][0] as string).slice("AUDIT ".length));
    expect("detail" in record).toBe(false);

    spy.mockRestore();
  });
});
