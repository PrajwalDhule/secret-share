// src/server/trpc/context.ts

import { prisma } from "../db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await getServerSession(authOptions);

  return {
    session,
    db: prisma,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;