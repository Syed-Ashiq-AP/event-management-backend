import { z, ZodObject } from "zod";
export const isValid = (check, zObj) => {
    const verify = zObj.safeParse(check);
    return verify.success;
};
export const EventSchema = z.object({
    userId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    location: z.string(),
    eventDate: z.string().pipe(z.iso.datetime()),
});
//# sourceMappingURL=types.js.map