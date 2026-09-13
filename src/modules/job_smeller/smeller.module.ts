import { SmellerController } from "./smeller.controller";
import { SmellerService } from "./smeller.service";

const smellerService = new SmellerService();
const smellerController = new SmellerController(smellerService);

export { smellerController } 