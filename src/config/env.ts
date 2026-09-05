import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z
    .string()
    .optional()
    .transform((val) => val || process.env.DATABASE_URL || ''),
  SUPABASE_URL: z.string().default('https://placeholder.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('placeholder-service-role-key'),
  PAYSTACK_SECRET_KEY: z.string().default('sk_test_placeholder'),
  PAYSTACK_PUBLIC_KEY: z.string().default('pk_test_placeholder'),
});

let parsedEnv: z.infer<typeof envSchema>;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed. Missing or invalid variables:');
    for (const issue of error.issues) {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    }
  } else {
    console.error('❌ Failed to load environment:', error);
  }
  process.exit(1);
}

export const env = parsedEnv;
