import express from "express";
import cors from "cors";
import fileRouter from "./routes/file.route.js";
import directoryRouter from "./routes/directory.route.js";
import userRouter from "./routes/user.route.js";
import cookieParser from "cookie-parser";
import { checkIsLoggedIn } from "./middlewares/auth.middleware.js";
import { connectDb, disConnectDb } from "./db.js";

process.on("SIGINT", async () => {
  await disConnectDb();
  console.log("database disconnected");
  process.exit(0);
});

try {
  const app = express();
  const db = await connectDb();
  console.log("db is connected ", db.databaseName);

  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  app.use(cookieParser());
  app.use(express.json());

  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    }),
  );

  app.use("/directory", checkIsLoggedIn, directoryRouter);
  app.use("/file", checkIsLoggedIn, fileRouter);
  app.use("/user", userRouter);

  app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
  });

  app.listen(4000, () => {
    console.log(`Server Started`);
  });
} catch (error) {
  console.log("could not connect to the database");
  console.log(error.message);
}

// // Enabling CORS
// app.use((req, res, next) => {
//   res.set({
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Methods": "*",
//     "Access-Control-Allow-Headers": "*",
//   });
//   next();
// });

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
