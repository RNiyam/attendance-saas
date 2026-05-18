import type { FileStorageProvider, UploadInput, UploadResult } from "./file-storage.types";

/**
 * S3 provider stub for future rollout.
 * Implement using AWS SDK and bucket config when S3 is available.
 */
export class S3StorageProvider implements FileStorageProvider {
  async upload(_input: UploadInput): Promise<UploadResult> {
    throw new Error("S3StorageProvider is not configured yet");
  }
}
