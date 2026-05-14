import File from '../models/file.model.js';
import { errorResponse } from '../Response.js';
import { GenerateS3PreSignedUrl } from '../services/aws/s3.service.js';

async function generatePresignedUrl(req, res) {
    const { id: userId, rootDirId } = req.user;
    const { fileName, ContentLength, ContentType } = req.body;
    const parentDirId = req.body.parentDirId || rootDirId;
    const extension = fileName.split('.')[1];

    if (ContentLength > 1024 * 1024 * 50) {
        return errorResponse(res, 'file size is too big');
    }
    if (fileName == '') {
        return errorResponse(res, 'no file name');
    }

    const file = new File({
        extension,
        name: fileName,
        size: ContentLength,
        userId,
        parentDirId,
    });

    await file.save();

    const preSignedUrl = GenerateS3PreSignedUrl({
        ContentLength,
        ContentType,
        fileName,
    });

    return res.status(201).json({
        success: true,
        url: preSignedUrl,
        extension,
        id: file.id,
    });
}

export const s3Controller = { generatePresignedUrl };
