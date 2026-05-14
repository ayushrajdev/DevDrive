import './utils/env.js';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import { ENV } from './utils/env.js';
import cookieParser from 'cookie-parser';
import otpRouter from './routes/otp.route.js';
import fileRouter from './routes/file.route.js';
import userRouter from './routes/user.route.js';
import adminRouter from './routes/admin.route.js';
import authRouter from './routes/auth.route.js';
import managerRouter from './routes/manager.route.js';
import directoryRouter from './routes/directory.route.js';
import { checkUser } from './middlewares/auth.middleware.js';
import { checkSession } from './middlewares/session.middleware.js';
import { checkAdmin } from './middlewares/admin.middleware.js';
import { checkManager } from './middlewares/manager.middleware.js';


const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser(ENV.SECRET_KEY));

app.use(
    cors({
        origin: true,
        credentials: true,
    }),
);

app.use('/api/otp', otpRouter);
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/file', checkSession, checkUser, fileRouter);
app.use('/api/directory', checkSession, checkUser, directoryRouter);

app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});

export default app;

// //http redirection
// app.all("/", async (req, res, next) => {
//   //M1
//   // res.set({
//   //   Location: "/user/profile",
//   // });
//   // res.status(301).end();

//   // M2
//   // res
//   //   .writeHead(301, {
//   //     location: "/user/profile",
//   //   })
//   //   .end()

//   //M3
//   res.redirect(301, "/user/profile");
// });
