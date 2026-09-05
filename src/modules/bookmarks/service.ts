import { prisma } from '../../config/prisma.js';

// In-memory set for bookmarks if not in db schema
const bookmarksStore = new Map<string, Set<string>>();

export async function getBookmarks(userId: string) {
  const qIds = Array.from(bookmarksStore.get(userId) || []);
  if (qIds.length === 0) return [];

  const questions = await prisma.question.findMany({
    where: { id: { in: qIds } },
  });

  return questions.map((q) => {
    const rawOptions = Array.isArray(q.options) ? q.options : [];
    const options = rawOptions.map((o: any) => (typeof o === 'string' ? o : o.text || ''));
    let correctOptionIndex = 0;
    if (typeof q.correctOptionId === 'string') {
      const idx = rawOptions.findIndex((o: any) =>
        typeof o === 'string' ? o === q.correctOptionId : o.id === q.correctOptionId
      );
      if (idx !== -1) correctOptionIndex = idx;
    }

    return {
      questions: {
        id: q.id,
        question_text: q.questionText,
        options,
        correct_option_index: correctOptionIndex,
        explanation: q.explanation,
      },
    };
  });
}

export async function addBookmark(userId: string, questionId: string) {
  if (!bookmarksStore.has(userId)) {
    bookmarksStore.set(userId, new Set());
  }
  bookmarksStore.get(userId)!.add(questionId);
  return { success: true };
}

export async function removeBookmark(userId: string, questionId: string) {
  if (bookmarksStore.has(userId)) {
    bookmarksStore.get(userId)!.delete(questionId);
  }
  return { success: true };
}
