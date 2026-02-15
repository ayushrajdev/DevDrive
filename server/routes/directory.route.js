import express from "express";
import directoryController from "../controllers/directory.controller.js";

const router = express.Router();

router.get("/:id?", directoryController.getDirDetails);

router.post("/:dirname?", directoryController.createNewDir);

router
  .route("/:id")
  .put(directoryController.renameDir)
  .delete(directoryController.deleteDir);

export default router;
