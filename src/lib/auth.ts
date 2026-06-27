import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL as string;

export const auth = betterAuth({
  trustedOrigins: [FRONTEND_BASE_URL],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      disableImplicitSignUp: true,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      disableImplicitSignUp: true,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ["PARTICIPANT", "ORGANIZER"],
        required: true,
      },
    },
  },
  onAPIError: {
    errorURL: `${FRONTEND_BASE_URL}/sign-in`,
  },
});
