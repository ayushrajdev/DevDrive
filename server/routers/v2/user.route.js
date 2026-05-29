import express from 'express';
import { checkUser } from '../../middlewares/auth.middleware.js';
import userController from '../../controllers/user.controller.js';
import { checkSession } from '../../middlewares/session.middleware.js';
import { checkOtp } from '../../middlewares/otp.middleware.js';
import { authorizeRoles } from '../../middlewares/authorizeRoles.middleware.js';
const router = express.Router();

router.post('/register', userController.registerUser);

router.post('/login', userController.loginUser);

router.post(
    '/logout',
    authorizeRoles('user', 'admin', 'manager', 'owner'),
    userController.logoutUser,
);
router.post(
    '/logout/alldevices',
    checkSession,
    checkUser,
    userController.logoutFromAllDevices,
);

router.get('/profile', checkSession, checkUser, userController.getUserInfo);

router.get('/all-users', adminController.getAllUsers);
router.delete('/delete-account', adminController.deleteUser);
router.post('/disable-account', adminController.disableUser);
router.post('/recover-account', adminController.recoverUser);

export default router;
