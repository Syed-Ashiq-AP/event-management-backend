export declare const auth: import("better-auth").Auth<{
    trustedOrigins: string[];
    database: (options: import("better-auth").BetterAuthOptions) => import("better-auth").DBAdapter<import("better-auth").BetterAuthOptions>;
    baseURL: string | undefined;
    emailAndPassword: {
        enabled: true;
    };
    socialProviders: {
        github: {
            clientId: string;
            clientSecret: string;
            disableImplicitSignUp: true;
        };
        google: {
            clientId: string;
            clientSecret: string;
            disableImplicitSignUp: true;
        };
    };
    user: {
        additionalFields: {
            role: {
                type: ("PARTICIPANT" | "ORGANIZER")[];
                required: true;
            };
        };
    };
    onAPIError: {
        errorURL: string;
    };
}>;
//# sourceMappingURL=auth.d.ts.map