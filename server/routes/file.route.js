import express from "express";
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
router.post("/:filename", fileController.createFile);

// vfs done ✅
router.delete("/:id", fileController.deleteFile);

//vfs done✅
router.get("/:id", fileController.getFile);

// vfs done ✅
router.put("/:id", fileController.renameFile);

export default router;
