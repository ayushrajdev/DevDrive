import express from "express";

import { adminController } from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/", adminController.getAllSessions);

export default router;
