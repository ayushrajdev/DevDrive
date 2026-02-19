import express from "express";
import fileController from "../controllers/file.controller.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// router.param("id", (req, res, next, id) => {
//   if (!ObjectId.isValid(id)) {
//     return errorResponse(res, "invalid id");
//   }
//   next();
// });

//vfs done ✅
router.post("/:filename", fileController.createFile);

// vfs done ✅
router.delete("/:id", fileController.deleteFile);

//vfs done✅
router.get("/:id", fileController.getFile);

// vfs done ✅
router.put("/:id", fileController.renameFile);

export default router;
