import { prisma } from '../../config/prisma.js';

export async function getQuestionsByCourseId(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  // CRITICAL SECURITY RULE:
  // Explicitly select only non-answer fields to prevent exposing answers to clients.
  // NEVER include correctOptionId or explanation in this query.
  const questions = await prisma.question.findMany({
    where: { courseId },
    select: {
      id: true,
      courseId: true,
      topic: true,
      questionText: true,
      options: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return {
    course: {
      id: course.id,
      code: course.code,
      title: course.title,
    },
    count: questions.length,
    questions,
  };
}
