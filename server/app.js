import './env.js';
import cors from 'cors';
import express from 'express';
import { ENV } from './env.js';
import cookieParser from 'cookie-parser';
import fileRouter from './routes/file.route.js';
import userRouter from './routes/user.route.js';
import directoryRouter from './routes/directory.route.js';
import { checkUserAuth } from './middlewares/auth.middleware.js';


const app = express();
app.use(express.json());
app.use(cookieParser(ENV.SECRET_KEY));

app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
    }),
);

app.use('/user', userRouter);
app.use('/file', checkUserAuth, fileRouter);
app.use('/directory', checkUserAuth, directoryRouter);

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
