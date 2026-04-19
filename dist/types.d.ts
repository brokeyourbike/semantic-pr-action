import { z } from "zod";
export declare const AIOutputSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
}, z.core.$strip>;
export type AIOutput = z.infer<typeof AIOutputSchema>;
