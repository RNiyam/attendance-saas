import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3Client = new S3Client({
  forcePathStyle: true,
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  region: process.env.SUPABASE_S3_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || "",
  },
});

export async function uploadBase64ToS3(base64Image: string): Promise<string> {
  const matches = base64Image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 image format");
  }

  const type = matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  
  const filename = crypto.randomUUID() + "." + (type === "jpeg" ? "jpg" : type);
  const bucket = "avatars";

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: filename,
    Body: buffer,
    ContentType: `image/${type}`,
  });

  await s3Client.send(command);

  // Return the public URL
  const endpoint = process.env.SUPABASE_S3_ENDPOINT || "";
  const projectIdMatch = endpoint.match(/https:\/\/(.*?)\.storage\.supabase\.co/);
  
  if (projectIdMatch && projectIdMatch[1]) {
    return `https://${projectIdMatch[1]}.supabase.co/storage/v1/object/public/${bucket}/${filename}`;
  }
  
  const baseUrl = endpoint.replace("/storage/v1/s3", "");
  return `${baseUrl}/storage/v1/object/public/${bucket}/${filename}`;
}
