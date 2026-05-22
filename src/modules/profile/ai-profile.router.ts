import { Router } from "express";
import { generateProfileController } from "./ai-profile.controller";

const router = Router();

router.post("/generate", generateProfileController);

export default router;