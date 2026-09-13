import { Router } from 'express';
import { smellerController } from './smeller.module';

const smellerRouter = Router();

smellerRouter.get("/smell-to", smellerController.kariyerScrapeWithAI.bind(smellerController));


export default smellerRouter;