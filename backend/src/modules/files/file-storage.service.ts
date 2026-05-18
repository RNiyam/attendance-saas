import { LocalStorageProvider } from "./local-storage.provider";
import { S3StorageProvider } from "./s3-storage.provider";
import type { FileStorageProvider } from "./file-storage.types";

const providerType = process.env.FILE_STORAGE_PROVIDER ?? "local";

export function getFileStorageProvider(): FileStorageProvider {
  if (providerType === "s3") {
    return new S3StorageProvider();
  }
  return new LocalStorageProvider();
}
