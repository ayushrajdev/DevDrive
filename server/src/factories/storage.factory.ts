import path from 'path';
import { ENV } from '../shared/utils/env.js';
import {
    LocalDiskStorage,
    S3UploadUrlSigner,
    type IFileStorage,
    type IUploadUrlSigner,
} from '../providers/storage/file-storage.js';

/** Factory for storage strategies, driven by environment configuration. */
export class StorageFactory {
    static createStorage(): IFileStorage {
        return new LocalDiskStorage(ENV.STORAGE_DIR || path.resolve(process.cwd(), 'storage'));
    }

    /** Returns null when no cloud bucket is configured. */
    static createUploadSigner(): IUploadUrlSigner | null {
        if (!ENV.S3_BUCKET) return null;
        return new S3UploadUrlSigner(ENV.S3_BUCKET, ENV.AWS_REGION);
    }
}
