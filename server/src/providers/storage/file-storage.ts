import fs from 'fs';
import path from 'path';
import { rm } from 'fs/promises';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/** Strategy for where file bytes live. */
export interface IFileStorage {
    /** Absolute location of the stored object (local disk path). */
    resolvePath(objectKey: string): string;
    exists(objectKey: string): boolean;
    remove(objectKey: string): Promise<void>;
}

export class LocalDiskStorage implements IFileStorage {
    private readonly baseDir: string;

    constructor(baseDir: string) {
        this.baseDir = path.resolve(baseDir);
        fs.mkdirSync(this.baseDir, { recursive: true });
    }

    resolvePath(objectKey: string): string {
        const resolved = path.resolve(this.baseDir, path.basename(objectKey));
        if (!resolved.startsWith(this.baseDir + path.sep)) {
            throw new Error('Invalid storage key');
        }
        return resolved;
    }

    exists(objectKey: string): boolean {
        return fs.existsSync(this.resolvePath(objectKey));
    }

    async remove(objectKey: string): Promise<void> {
        await rm(this.resolvePath(objectKey), { force: true });
    }
}

export interface UploadUrlRequest {
    key: string;
    contentLength: number;
    contentType: string;
}

/** Strategy for direct-to-cloud uploads. */
export interface IUploadUrlSigner {
    createUploadUrl(request: UploadUrlRequest): Promise<string>;
}

export class S3UploadUrlSigner implements IUploadUrlSigner {
    private client?: S3Client;

    constructor(
        private readonly bucket: string,
        private readonly region: string,
    ) {}

    async createUploadUrl({ key, contentLength, contentType }: UploadUrlRequest): Promise<string> {
        this.client ??= new S3Client({ region: this.region });
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentLength: contentLength,
            ContentType: contentType,
        });
        return getSignedUrl(this.client, command, {
            expiresIn: 3600,
            signableHeaders: new Set(['content-type']),
        });
    }
}
