// src/server/api/root.ts

import { createTRPCRouter } from "../trpc";
import { secretsRouter } from "./routers/secrets";
import { userRouter } from "./routers/user";

export const appRouter = createTRPCRouter({
  secrets: secretsRouter,
  user: userRouter
});

export type AppRouter = typeof appRouter;