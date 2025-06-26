// src/server/api/routers/user.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { hashPassword } from "@/utils/hash";

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(3, "Name is required"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters long"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error("User with this email already exists.");
      }

      const hashedPassword = await hashPassword(input.password);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          // You might add name: input.name if you collect it during signup
        },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        message: "Registration successful!",
      };
    }),
});
