import { z, ZodObject } from "zod";
export declare const isValid: (check: Object, zObj: ZodObject) => boolean;
export declare const EventSchema: z.ZodObject<{
    userId: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    location: z.ZodString;
    eventDate: z.ZodPipe<z.ZodString, z.ZodISODateTime>;
}, z.core.$strip>;
//# sourceMappingURL=types.d.ts.map