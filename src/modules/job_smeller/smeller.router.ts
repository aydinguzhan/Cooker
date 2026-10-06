import { Router } from 'express';
import { smellerController } from './smeller.module';
import { cookerAuthMiddleware } from './middleware/cooker-auth.middleware.js';

const smellerRouter = Router();

smellerRouter.get("/smell-to", smellerController.kariyerScrapeWithAI.bind(smellerController));
smellerRouter.post(
    "/match-jobs",
    // cookerAuthMiddleware,
    smellerController.matchJobs.bind(smellerController),
);


export default smellerRouter;
