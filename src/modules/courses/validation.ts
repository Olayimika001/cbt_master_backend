import { z } from 'zod';

export const createCourseSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, 'Course code must be at least 2 characters')
      .max(20, 'Course code cannot exceed 20 characters')
      .toUpperCase(),
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title cannot exceed 200 characters'),
    description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters').optional().nullable(),
    isFree: z.boolean().default(false),
  })
  .strict();

export const updateCourseSchema = createCourseSchema.partial();

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required').default(''),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const filterQuerySchema = z.object({
  isFree: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type FilterQueryInput = z.infer<typeof filterQuerySchema>;
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
