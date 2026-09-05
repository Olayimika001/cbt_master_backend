import { z } from 'zod';

export const saveAnswerSchema = z
  .object({
    selectedOptionId: z
      .string()
      .trim()
      .min(1, 'selectedOptionId cannot be empty'),
  })
  .strict();

export const submitAttemptSchema = z
  .object({
    idempotencyKey: z.string().trim().min(1).optional(),
  })
  .strict();

export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
