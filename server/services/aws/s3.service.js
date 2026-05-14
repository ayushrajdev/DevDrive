import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const s3Client = new S3Client({
    profile: 'devdrive',
    // credentials:{}
});

export function GenerateS3PreSignedUrl({
    fileName,
    ContentType,
    ContentLength,
}) {
    const command = new PutObjectCommand({
        Bucket: 'devdrive-web',
        Key: fileName,
        Expires: 3600,
        ContentLength,
        ContentType,
    });

    const preSignedUrl = getSignedUrl(s3Client, command, {
        expiresIn: 3600,
        signableHeaders: new Set(['content-type']),
    });
}
