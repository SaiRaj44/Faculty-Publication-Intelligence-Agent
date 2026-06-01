import fs from 'fs';
import path from 'path';
import { StorageFile } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';

interface StorageAdapter {
  upload(buffer: Buffer, originalFilename: string, mimeType: string, folder?: string): Promise<StorageFile>;
  download(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
  getUrl(filePath: string): string;
}

class LocalStorageAdapter implements StorageAdapter {
  private basePath: string;
  private baseUrl: string;

  constructor() {
    this.basePath = path.resolve(process.cwd(), process.env.STORAGE_LOCAL_PATH || './uploads');
    this.baseUrl = `${process.env.APP_URL || 'http://localhost:3000'}/uploads`;
    
    // Ensure base directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async upload(buffer: Buffer, originalFilename: string, mimeType: string, folder: string = ''): Promise<StorageFile> {
    const ext = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, ext);
    const safeName = slugify(baseName, { lower: true, strict: true });
    const fileName = `${safeName}-${uuidv4()}${ext}`;
    
    const targetDir = path.join(this.basePath, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, fileName);
    const relativePath = path.posix.join(folder, fileName);
    
    await fs.promises.writeFile(filePath, buffer);

    return {
      path: relativePath,
      url: this.getUrl(relativePath),
      size: buffer.length,
      mimeType
    };
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.promises.readFile(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  getUrl(filePath: string): string {
    return `${this.baseUrl}/${filePath}`;
  }
}

class S3StorageAdapter implements StorageAdapter {
  // Mock S3 implementation for now.
  // In a real scenario, this would use the @aws-sdk/client-s3 package.
  constructor() {
    if (!process.env.STORAGE_S3_BUCKET) {
      console.warn('STORAGE_S3_BUCKET is not set but S3 storage type is selected.');
    }
  }

  async upload(buffer: Buffer, originalFilename: string, mimeType: string, folder: string = ''): Promise<StorageFile> {
    console.log(`[S3 Mock] Uploading ${originalFilename} to ${folder}`);
    return {
      path: `s3://${process.env.STORAGE_S3_BUCKET}/${folder}/${originalFilename}`,
      url: `https://${process.env.STORAGE_S3_BUCKET}.s3.amazonaws.com/${folder}/${originalFilename}`,
      size: buffer.length,
      mimeType
    };
  }

  async download(filePath: string): Promise<Buffer> {
    console.log(`[S3 Mock] Downloading ${filePath}`);
    return Buffer.from('');
  }

  async delete(filePath: string): Promise<void> {
    console.log(`[S3 Mock] Deleting ${filePath}`);
  }

  getUrl(filePath: string): string {
    return `https://${process.env.STORAGE_S3_BUCKET}.s3.amazonaws.com/${filePath}`;
  }
}

const getStorageAdapter = (): StorageAdapter => {
  const type = process.env.STORAGE_TYPE || 'local';
  if (type === 's3') {
    return new S3StorageAdapter();
  }
  return new LocalStorageAdapter();
};

export const storage = getStorageAdapter();

export const uploadFile = (buffer: Buffer, filename: string, mimeType: string, folder?: string) => {
  return storage.upload(buffer, filename, mimeType, folder);
};
