// src/server.ts
import { app } from "./app.js";
import { env } from "./config/env.js";
app.listen(env.PORT, () => {
  console.log(`AI Service running on port ${env.PORT}`);
});