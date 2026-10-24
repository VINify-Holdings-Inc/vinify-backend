import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

// Profile photos used to be written to the instance's local disk, which is lost
// whenever the ASG replaces the instance. They live in S3 instead; the
// /api/uploads/<file> URL stored for each user is unchanged.
const BUCKET = process.env.UPLOADS_BUCKET || "vinify-user-uploads-010526276308";
const PREFIX = "profile-photos/";

const client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

export const putProfilePhoto = async (
  fileName: string,
  body: Buffer,
  contentType: string
): Promise<void> => {
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `${PREFIX}${fileName}`,
      Body: body,
      ContentType: contentType,
    })
  );
};

export const getProfilePhoto = async (
  fileName: string
): Promise<{ body: Readable; contentType?: string } | null> => {
  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: `${PREFIX}${fileName}` })
    );
    return { body: res.Body as Readable, contentType: res.ContentType };
  } catch (err: any) {
    if (err?.name === "NoSuchKey") return null;
    throw err;
  }
};
