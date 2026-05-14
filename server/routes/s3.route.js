import { Router } from 'express';
import { s3Controller } from '../controllers/s3.controller.js';
import { checkUser } from '../middlewares/auth.middleware';
import { checkAvilableSpaceForFileUpload } from '../middlewares/file.middleware.js';
import { checkSession } from '../middlewares/session.middleware.js';

const router = Router();

router.post(
    '/upload/initiate',
    checkSession,
    checkUser,
    checkAvilableSpaceForFileUpload,
    s3Controller.generatePresignedUrl,
);

export default router;
