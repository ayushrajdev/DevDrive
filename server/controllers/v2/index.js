import MongoAuthRepository from '../../repositories/mongodb/auth.repository.js';
import MongoDirectoryRepository from '../../repositories/mongodb/directory.repository.js';
import MongoFileRepository from '../../repositories/mongodb/file.repository.js';
import V2OtpRepository from '../../repositories/mongodb/otp.repository.js';
import V2FileService from '../../services/v2/file.service.js';
import V2OtpService from '../../services/v2/otp.service.js';
import V2UserService from '../../services/v2/user.service.js';
import V2AuthController from './auth.controller.js';
import V2DirectoryController from './directory.controller.js';
import V2FileController from './file.controller.js';
import V2OtpController from './otp.controller.js';
import V2S3Controller from './s3.controller.js';
import V2UserController from './user.controller';

const otpRepository = new V2OtpRepository();
const otpService = new V2OtpService({ otpRepository });
const otpController = new V2OtpController({ otpService });

const authRepository = new MongoAuthRepository();
const authController = new V2AuthController();

const directoryRepository = new MongoDirectoryRepository();
const directoryService = new V2DirectoryService();
const directoryController = new V2DirectoryController();

const fileController = new V2FileController();
const fileService = new V2FileService();
const fileRepository = new MongoFileRepository();

const s3Controller = new V2S3Controller();

const userController = new V2UserController();
const userService = new V2UserService();

const controllers = {
    otpController,
    authController,
    directoryController,
    fileController,
    s3Controller,
    userController,
};

export default controllers;
