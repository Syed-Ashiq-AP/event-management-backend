import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;
const isProduction = process.env.NODE_ENV === "production";
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
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            disableImplicitSignUp: true,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
    advanced: {
        crossSubDomainCookies: {
            enabled: false,
        },
        defaultCookieAttributes: {
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction,
        },
    },
});
