import express from "express";
import { createWriteStream, writeFileSync } from "fs";
import path from "path";
import { rm, writeFile } from "fs/promises";
import filesData from "../fileDB.json" with { type: "json" };
import directoriesData from "../directoriesDB.json" with { type: "json" };
import { dirIdOfCurrentUser } from "../middlewares/auth.middleware.js";
import { errorResponse } from "../Response.js";
import fileController from "../controllers/file.controller.js";

const router = express.Router();

// router.param("id", (req, res, next, id) => {
//   const uuidRegex =
//     /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
//   if (!uuidRegex.test(id)) {
//     return errorResponse(res, "invalid id");
//   }
//   next();
// });

//vfs done ✅
router.post("/:filename", dirIdOfCurrentUser, fileController.createFile);

// vfs done ✅
router.delete("/:id", fileController.deleteFile);

//vfs done✅
router.get("/:id", fileController.getFile);

// vfs done ✅
router.put("/:id", fileController.renameFile);

export default router;
