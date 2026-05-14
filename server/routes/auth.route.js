import { Router } from 'express';
import { verifyGoogleIdTokenMiddleware } from '../middlewares/google.middleware.js';
import authController from '../controllers/auth.controller.js';
import {
    clientId,
    clientSecret,
    githubAuthUrl,
} from '../config/oauth/github.config.js';
const router = Router();

router.post(
    '/google',
    verifyGoogleIdTokenMiddleware,
    authController.loginWithGoogle,
);

router.get('/github', (req, res) => {
    const url =
        'https://github.com/login/oauth/authorize' +
        '?client_id=' +
        clientId +
        '&scope=user:email' +
        '&redirect_uri=http://localhost:4000/auth/github/callback';

    res.redirect(url);
});

router.get('/github/callback', async (req, res) => {
    try {
        const code = req.query.code;

        const tokenResponse = await fetch(
            'https://github.com/login/oauth/access_token',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: code,
                }),
            },
        );

        const tokenData = await tokenResponse.json();

        const accessToken = tokenData.access_token;

        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const user = await userResponse.json();

        res.send(`
        <script>
          window.opener.postMessage(
            ${JSON.stringify({ success: true, sessionId: '1234' })},
            "http://localhost:3000"
          );
          window.close();
        </script>
      `);
    } catch (error) {
        res.send(`
        <script>
          window.opener.postMessage(
            ${JSON.stringify({ success: false })},
            "http://localhost:3000"
          );
          window.close();
        </script>
      `);
    }
});


router.get('/github/set-cookie', async (req, res) => {
    const { sessionId } = req.query;
    res.cookie('sessionId', sessionId, {
        httpOnly: true,
        // sameSite: 'none',
    });
    res.end();
});

export default router;
