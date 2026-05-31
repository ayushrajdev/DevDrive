import './utils/env.js';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import { ENV } from './utils/env.js';
import cookieParser from 'cookie-parser';
import v2Router from './routers/v2/index.js';



const app = express();

app.use(helmet());
app.use(cookieParser(ENV.SECRET_KEY));

app.use(
    cors({
        origin: true,
        credentials: true,
    }),
);




app.use("/api/v2",v2Router)

app.use((err, req, res, next) => {
    console.log(err);
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
