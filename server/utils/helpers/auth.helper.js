import { errorResponse } from '../../Response.js';
import crypto from 'crypto';

export function checkAuthToken(res, token) {
    const [cookiePayload, signature] = token.split('.');
    const hashOfData = crypto
        .createHash('sha256')
        .update(Buffer.from(cookiePayload, 'base64url').toString('utf8'))
        .update(process.env.SECRET_KEY)
        .digest('base64url');

    if (hashOfData == signature) {
        console.log('token is not tampered');
    } else {
        return errorResponse(res, 'token is tampered');
    }
    const { expiry, id } = JSON.parse(
        Buffer.from(cookiePayload, 'base64url').toString('utf8'),
    );
    const expiryTimeInSecond = parseInt(expiry, 16);
    const currentTimeInSecond = Math.floor(Number(Date.now() / 1000));
    console.log({ currentTimeInSecond, expiryTimeInSecond });
    if (!(expiryTimeInSecond - currentTimeInSecond >= 0)) {
        res.clearCookie('token');
        return res.end();
    }
    return id
}

export function Generate_JWT_Token(res, user) {
    const cookiePayload = JSON.stringify({
        expiry: Math.round(Date.now() / 1000 + 4000).toString('16'),
        id: user._id.toString(),
    });

    const signature = crypto
        .createHash('sha256')
        .update(cookiePayload)
        .update(process.env.SECRET_KEY)
        .digest('base64url');

    const signedCookiePayload = `${Buffer.from(cookiePayload).toString('base64url')}.${signature}`;

    res.cookie('token', signedCookiePayload, {
        httpOnly: true,
    });
    return signedCookiePayload
}
