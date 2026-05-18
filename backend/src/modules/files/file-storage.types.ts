export type UploadInput = {
  organizationId: number;
  folder: string;
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type UploadResult = {
  key: string;
  url: string;
};

export interface FileStorageProvider {
  upload(input: UploadInput): Promise<UploadResult>;
}
