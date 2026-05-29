import { googleAuthClient } from "../../config/oauth/google.config.js";

export async function verifyGoogleIdTokenService(idToken) {
    try {
        const loginTicket = await googleAuthClient.verifyIdToken({
            idToken,
        });
        return loginTicket.getPayload();
    } catch (error) {
        console.log(error.message);
        return null
    }
}