import { z } from "zod";

export const AIOutputSchema = z.object({
  title: z
    .string()
    .max(30, "Title must be 30 characters or less")
    .regex(
      /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)(\(.+\))?: .+/i,
    ),
  description: z.string().min(10),
});

export type AIOutput = z.infer<typeof AIOutputSchema>;
