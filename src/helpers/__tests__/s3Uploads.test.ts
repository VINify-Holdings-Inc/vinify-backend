const send = jest.fn();
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({ send })),
  PutObjectCommand: jest.fn((input) => ({ input })),
  GetObjectCommand: jest.fn((input) => ({ input })),
}));

import { getProfilePhoto, putProfilePhoto } from "../s3Uploads";

describe("s3Uploads", () => {
  beforeEach(() => send.mockReset());

  it("stores a photo under the profile-photos/ prefix", async () => {
    send.mockResolvedValue({});
    await putProfilePhoto("1_a.jpg", Buffer.from("x"), "image/jpeg");
    expect(send.mock.calls[0][0].input).toMatchObject({
      Key: "profile-photos/1_a.jpg",
      ContentType: "image/jpeg",
    });
  });

  it("returns null when the photo does not exist", async () => {
    send.mockRejectedValue({ name: "NoSuchKey" });
    expect(await getProfilePhoto("missing.jpg")).toBeNull();
  });

  it("rethrows other S3 errors", async () => {
    send.mockRejectedValue({ name: "AccessDenied" });
    await expect(getProfilePhoto("a.jpg")).rejects.toEqual({ name: "AccessDenied" });
  });
});
