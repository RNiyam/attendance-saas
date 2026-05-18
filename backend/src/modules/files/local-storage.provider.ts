import fs from "node:fs/promises";
import path from "node:path";
import type { FileStorageProvider, UploadInput, UploadResult } from "./file-storage.types";

const uploadRoot = path.resolve(process.cwd(), "uploads");

export class LocalStorageProvider implements FileStorageProvider {
  async upload(input: UploadInput): Promise<UploadResult> {
    const safeFolder = input.folder.replace(/[^a-zA-Z0-9/_-]/g, "_");
    const key = `${input.organizationId}/${safeFolder}/${Date.now()}-${input.filename}`;
    const target = path.join(uploadRoot, key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, input.content);
    return {
      key,
      url: `/uploads/${key}`,
    };
  }
}
