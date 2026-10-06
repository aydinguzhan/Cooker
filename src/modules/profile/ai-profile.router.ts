import { Router } from "express";
import { generateProfileController, ProfileController } from "./ai-profile.controller";
import { ProfileService } from "./ai-profile.service";
import ProfileChainRepository from "./profile-chain.repository";

const router = Router();
const profileRepository = new ProfileChainRepository()
const profileService = new ProfileService(profileRepository)
const profileController = new ProfileController(profileService)

router.post("/generate", generateProfileController);
router.post("/generate-langchain", profileController.createProfile.bind(profileController));

export default router;