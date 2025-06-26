// server/api/routers/secrets.ts

import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "../../trpc";
import { nanoid } from "nanoid";
import { hashPassword, verifyPassword } from "@/utils/hash";
import { prisma } from "@/server/db";
import { TRPCError } from "@trpc/server";
import { Prisma, Secret } from "@prisma/client";

export const secretsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        ciphertext: z.string(),
        iv: z.string(),
        expiresIn: z.number(), // in seconds
        oneTime: z.boolean(),
        password: z.string().optional(),
        encryptionKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = nanoid(12);
      const expiresAt = new Date(Date.now() + input.expiresIn * 1000);
      const passwordHash = input.password
        ? await hashPassword(input.password)
        : null;

      const secretCreateInput: Prisma.SecretCreateInput = {
        slug,
        encryptedText: input.ciphertext,
        iv: input.iv,
        oneTime: input.oneTime,
        expiresAt,
      };

      if (input.password) {
        secretCreateInput.hasPassword = true;
        secretCreateInput.passwordHash = passwordHash;
      }

      if( input.encryptionKey) {
        secretCreateInput.encryptionKey = input.encryptionKey;
      }

      if (ctx.session?.user?.id) {
        secretCreateInput.user = {
          connect: {
            id: ctx.session.user.id, 
          },
        };
      }

      await prisma.secret.create({
        data: secretCreateInput,
      });

      return { slug, iv: input.iv };
    }),

  getBySlug: publicProcedure
    .input(z.string())
    .query(async ({ input: slug }) => {
      const secret = await prisma.secret.findUnique({
        where: { slug },
      });

      if (!secret) return { status: "not_found" as const };

      const now = new Date();
      if (secret.viewed && secret.oneTime) return { status: "viewed & consumed" as const };
      if (secret.expiresAt < now) return { status: "expired" as const };

      return {
        status: "available" as const,
        secret: {
          ciphertext: secret.encryptedText,
          iv: secret.iv,
          oneTime: secret.oneTime,
          hasPassword: secret.hasPassword,
        },
      };
    }),

  listByUser: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const secrets = await ctx.db.secret.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return secrets.map((s) => {
      let status: "active" | "expired" | "viewed & consumed" = "active";
      if (s.viewed && s.oneTime) status = "viewed & consumed";
      else if (s.expiresAt < now) status = "expired";

      return {
        id: s.id,
        slug: s.slug,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        oneTime: s.oneTime,
        hasPassword: s.hasPassword,
        encryptedText: s.encryptedText,
        encryptionKey: s.encryptionKey || undefined,
        iv: s.iv,
        status,
      };
    });
  }),

  markViewed: publicProcedure
  .input(z.string())
  .mutation(async ({ input: slug }) => {
    await prisma.secret.update({
      where: { slug },
      data: { viewed: true },
    });

    return { success: true };
  }),

  deleteBySlug: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: slug }) => {
      const secret = await ctx.db.secret.findUnique({
        where: { slug },
      });

      if (!secret || secret.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await ctx.db.secret.delete({ where: { slug } });

      return { success: true };
    }),

  verifySecretPassword: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { slug, password } = input;

      const secret = await prisma.secret.findUnique({
        where: { slug: slug },
        select: { passwordHash: true },
      });

      if (!secret || !secret.passwordHash) {
        // You might want to throw a specific error here, or return a distinct status
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Secret not found or not password protected.",
        });
      }

      const valid = await verifyPassword(secret.passwordHash, password);

      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid password.",
        });
      }

      return { success: true }; // Return a simple success message
    }),
});
