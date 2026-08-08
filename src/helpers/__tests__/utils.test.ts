import {
  encryptPayload,
  decryptPayload,
  generateToken,
  profileCompletion,
  isChangeInThePreviousVin,
  deletedExtraVinData,
} from "../utils";

describe("encryptPayload / decryptPayload", () => {
  it("round-trips a value: decrypting an encrypted payload returns the original", () => {
    const original = "sensitive-value-12345";
    const encrypted = encryptPayload(original);
    expect(decryptPayload(encrypted)).toBe(original);
  });

  it("produces different ciphertext for the same input on separate calls (random IV per call)", () => {
    const a = encryptPayload("same-input");
    const b = encryptPayload("same-input");
    expect(a).not.toBe(b);
  });

  it("encodes the IV and ciphertext as two base64 segments separated by ':'", () => {
    const encrypted = encryptPayload("x");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(2);
  });

  it("round-trips values containing unicode and special characters", () => {
    const original = "üñïçödé:with-colons::and emojis 🚗";
    expect(decryptPayload(encryptPayload(original))).toBe(original);
  });

  it("throws when given a malformed payload instead of silently returning garbage", () => {
    expect(() => decryptPayload("not-a-real-payload")).toThrow();
  });
});

describe("generateToken", () => {
  it("returns a 40-character hex string (20 random bytes)", () => {
    const token = generateToken();
    expect(token).toMatch(/^[0-9a-f]{40}$/);
  });

  it("returns a different value on each call", () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe("profileCompletion", () => {
  it("returns 0 when no tracked fields are filled in", () => {
    expect(profileCompletion({})).toBe(0);
  });

  it("returns 100 when every tracked field is filled in", () => {
    expect(
      profileCompletion({
        firstName: "A",
        lastName: "B",
        emailId: "a@b.com",
        secondaryEmailId: "c@d.com",
        companyId: "1",
        title: "Eng",
        profile: "pic.png",
      })
    ).toBe(100);
  });

  it("treats null, undefined, empty string, and the literal string 'undefined' as not filled in", () => {
    expect(
      profileCompletion({
        firstName: null,
        lastName: undefined,
        emailId: "",
        secondaryEmailId: "undefined",
        companyId: "1",
        title: "1",
        profile: "1",
      })
    ).toBe(43); // 3 of 7 fields filled -> ceil(300/7) = 43
  });

  it("rounds up (ceil), not to the nearest whole number", () => {
    // 1 of 7 fields = 14.28...% -> should round up to 15, not down to 14
    expect(profileCompletion({ firstName: "A" })).toBe(15);
  });
});

describe("isChangeInThePreviousVin", () => {
  it("marks every field as unchanged (false) when there is no previous record", () => {
    const result = isChangeInThePreviousVin({ vin: "1", status: "active" }, null);
    expect(result.isVin).toBe(false);
    expect(result.isStatus).toBe(false);
    expect(result.vin).toBe("1");
  });

  it("marks only the fields that actually differ from the previous record", () => {
    const result = isChangeInThePreviousVin(
      { vin: "1", status: "active" },
      { vin: "1", status: "inactive" }
    );
    expect(result.isVin).toBe(false);
    expect(result.isStatus).toBe(true);
  });
});

describe("deletedExtraVinData", () => {
  it("keeps only old records whose VIN still exists in the new dataset", () => {
    const newDataSet = [{ vin: "A" }, { vin: "B" }];
    const oldDataSet = [{ vin: "A", note: "keep" }, { vin: "C", note: "drop" }];
    const result = deletedExtraVinData(newDataSet, oldDataSet);
    expect(result).toEqual([{ vin: "A", note: "keep" }]);
  });

  it("returns an empty array when none of the old VINs are present in the new dataset", () => {
    const result = deletedExtraVinData([{ vin: "X" }], [{ vin: "Y" }]);
    expect(result).toEqual([]);
  });
});
