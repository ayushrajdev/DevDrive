import { verifyGoogleIdTokenService } from '../../services/google.service.js';

export async function verifyGoogleIdTokenMiddleware(req, res, next) {
    const { idToken } = req.body;
    console.log(idToken);
    try {
        const payload = await verifyGoogleIdTokenService(idToken);
        console.log(payload);
        req.user = payload;
        return next();
    } catch (error) {
        console.log(error);
    }
}
