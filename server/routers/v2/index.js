import { Router } from 'express';
// import authRouter from './auth.route.js';
// import userRouter from './auth.route.js';
// import otpRouter from './auth.route.js';
// import fileRouter from './auth.route.js';
// import directoryRouter from './auth.route.js';
import paymentRouter from './payment.route.js';
import webhookRouter from './webhook.route.js';

const v2Router = Router();

// app.use('/otp', otpRouter);
// app.use('/auth', authRouter);
// app.use('/users', userRouter);
// app.use('/files', checkSession, checkUser, fileRouter);
// app.use('/directory', checkSession, checkUser, directoryRouter);
// app.use('/payments', checkSession, checkUser, paymentRouter);
v2Router.use('/payments', paymentRouter);
v2Router.use('/webhooks', webhookRouter);

export default v2Router;
