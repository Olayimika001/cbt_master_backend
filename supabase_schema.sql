-- ==============================================================================
-- CBT Master: Complete Supabase Database Schema & RLS Policies
-- ==============================================================================
-- You can copy and paste this entire script directly into the Supabase SQL Editor:
-- Supabase Dashboard -> Project -> SQL Editor -> New query -> Paste & Run (Ctrl+Enter)
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if rebuilding (Ensures clean camelCase column matching with Prisma)
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "attempt_answers" CASCADE;
DROP TABLE IF EXISTS "attempts" CASCADE;
DROP TABLE IF EXISTS "subscriptions" CASCADE;
DROP TABLE IF EXISTS "questions" CASCADE;
DROP TABLE IF EXISTS "courses" CASCADE;
DROP TABLE IF EXISTS "profiles" CASCADE;

-- 3. Create Enums (Idempotent)
DO $$ BEGIN
    CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'PAUSED', 'SUBMITTED', 'GRADED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Create Tables

-- Profiles (maps 1:1 with Supabase auth.users)
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'student',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE
);

-- Courses
CREATE TABLE "courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- Questions
CREATE TABLE "questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courseId" UUID NOT NULL,
    "topic" TEXT,
    "questionText" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctOptionId" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- Attempts (CBT state machine)
CREATE TABLE "attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "questionSnapshot" JSONB NOT NULL,
    "score" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- Attempt Answers (Autosave upsert per question)
CREATE TABLE "attempt_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attemptId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "selectedOptionId" TEXT NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id")
);

-- Subscriptions
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- Notifications
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- 5. Create Indexes and Unique Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "courses_code_key" ON "courses"("code");
CREATE INDEX IF NOT EXISTS "questions_courseId_idx" ON "questions"("courseId");
CREATE UNIQUE INDEX IF NOT EXISTS "attempts_idempotencyKey_key" ON "attempts"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "attempts_userId_idx" ON "attempts"("userId");
CREATE INDEX IF NOT EXISTS "attempts_courseId_idx" ON "attempts"("courseId");
CREATE UNIQUE INDEX IF NOT EXISTS "attempt_answers_attemptId_questionId_key" ON "attempt_answers"("attemptId", "questionId");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_userId_courseId_key" ON "subscriptions"("userId", "courseId");
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");

-- 6. Add Foreign Keys
ALTER TABLE "questions" ADD CONSTRAINT "questions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7. Automatically Create Profile on User Signup (Supabase Auth Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. Row Level Security (RLS) Configuration
-- ==============================================================================
-- Protect tables against direct tampering if mobile app connects directly.
-- (The Express backend connects via the service-role key which bypasses RLS).

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attempt_answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read and update only their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON "profiles";
CREATE POLICY "Users can read own profile" ON "profiles" FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON "profiles";
CREATE POLICY "Users can update own profile" ON "profiles" FOR UPDATE USING (auth.uid() = id);

-- Courses: Anyone (authenticated or anon) can view courses
DROP POLICY IF EXISTS "Public can read courses" ON "courses";
CREATE POLICY "Public can read courses" ON "courses" FOR SELECT USING (true);

-- Attempts: Users can view only their own attempts (no direct inserts/updates)
DROP POLICY IF EXISTS "Users can read own attempts" ON "attempts";
CREATE POLICY "Users can read own attempts" ON "attempts" FOR SELECT USING (auth.uid() = "userId");

-- Attempt Answers: Users can view only answers for their own attempts
DROP POLICY IF EXISTS "Users can read own attempt answers" ON "attempt_answers";
CREATE POLICY "Users can read own attempt answers" ON "attempt_answers" FOR SELECT
USING (EXISTS (SELECT 1 FROM "attempts" WHERE "attempts"."id" = "attempt_answers"."attemptId" AND "attempts"."userId" = auth.uid()));

-- Subscriptions: Users can read their own subscriptions
DROP POLICY IF EXISTS "Users can read own subscriptions" ON "subscriptions";
CREATE POLICY "Users can read own subscriptions" ON "subscriptions" FOR SELECT USING (auth.uid() = "userId");

-- Notifications: Users can read and update (mark read) their own notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON "notifications";
CREATE POLICY "Users can read own notifications" ON "notifications" FOR SELECT USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update own notifications" ON "notifications";
CREATE POLICY "Users can update own notifications" ON "notifications" FOR UPDATE USING (auth.uid() = "userId");
