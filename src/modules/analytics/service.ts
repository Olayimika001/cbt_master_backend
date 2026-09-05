import { prisma } from '../../config/prisma.js';
import { getUserMemoryAttempts } from '../attempts/service.js';

export async function getUserAnalytics(userId: string) {
  // 1. Fetch from Prisma
  let dbAttempts: any[] = [];
  try {
    dbAttempts = await prisma.attempt.findMany({
      where: { userId, status: { in: ['SUBMITTED', 'GRADED', 'EXPIRED'] } },
      include: { course: true },
      orderBy: { startedAt: 'desc' },
    });
  } catch (_) {}

  // 2. Fetch from memory attempts
  const memAttempts = getUserMemoryAttempts(userId).filter(
    (a) => a.status === 'GRADED' || a.score !== undefined
  );

  // 3. Merge unique attempts by ID
  const allAttemptsMap = new Map<string, {
    id: string;
    courseId: string;
    courseCode: string;
    courseTitle: string;
    score: number;
    totalQuestions: number;
    scorePercent: number;
    startedAt: Date;
    submittedAt?: Date;
    timeTakenSeconds: number;
  }>();

  for (const a of dbAttempts) {
    const totalQ = (Array.isArray(a.questionSnapshot) ? a.questionSnapshot.length : 0) || 25;
    const score = a.score || 0;
    const scorePercent = Math.round((score / totalQ) * 100);
    const timeTakenSeconds = a.submittedAt && a.startedAt
      ? Math.max(0, Math.round((a.submittedAt.getTime() - a.startedAt.getTime()) / 1000))
      : 1200;

    allAttemptsMap.set(a.id, {
      id: a.id,
      courseId: a.courseId,
      courseCode: a.course?.code || 'CBT',
      courseTitle: a.course?.title || a.course?.code || 'CBT Exam',
      score,
      totalQuestions: totalQ,
      scorePercent,
      startedAt: a.startedAt || new Date(),
      submittedAt: a.submittedAt || undefined,
      timeTakenSeconds,
    });
  }

  for (const m of memAttempts) {
    const totalQ = m.totalQuestions || m.questions?.length || 25;
    const score = m.score || 0;
    const scorePercent = m.scorePercent ?? Math.round((score / totalQ) * 100);
    const timeTakenSeconds = m.timeTakenSeconds || 1200;

    allAttemptsMap.set(m.id, {
      id: m.id,
      courseId: m.courseId,
      courseCode: m.courseCode || 'CBT',
      courseTitle: m.courseTitle || 'CBT Exam',
      score,
      totalQuestions: totalQ,
      scorePercent,
      startedAt: m.startedAt || new Date(),
      submittedAt: m.submittedAt || undefined,
      timeTakenSeconds,
    });
  }

  const combinedAttempts = Array.from(allAttemptsMap.values()).sort(
    (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
  );

  const totalTests = combinedAttempts.length;
  let totalScorePoints = 0;
  let totalPercentageSum = 0;
  let totalTimeSeconds = 0;
  const courseStats: Record<string, { title: string; code: string; scores: number[]; totalQuestions: number[]; percentages: number[]; count: number }> = {};
  const dayScores: Record<string, number[]> = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (const a of combinedAttempts) {
    totalScorePoints += a.score * 10;
    totalPercentageSum += a.scorePercent;
    totalTimeSeconds += a.timeTakenSeconds;

    const dayName = dayNames[a.startedAt.getDay()] || 'Mon';
    if (dayScores[dayName]) {
      dayScores[dayName].push(a.scorePercent);
    }

    const cKey = a.courseCode || a.courseId;
    if (!courseStats[cKey]) {
      courseStats[cKey] = {
        title: a.courseTitle,
        code: a.courseCode,
        scores: [],
        totalQuestions: [],
        percentages: [],
        count: 0,
      };
    }
    courseStats[cKey].scores.push(a.score);
    courseStats[cKey].totalQuestions.push(a.totalQuestions);
    courseStats[cKey].percentages.push(a.scorePercent);
    courseStats[cKey].count += 1;
  }

  const averageScore = totalTests > 0 ? Math.round(totalPercentageSum / totalTests) : 0;
  const timeSpentMinutes = Math.round(totalTimeSeconds / 60);

  // Distinct active days
  const distinctDays = new Set(combinedAttempts.map((a) => a.startedAt.toISOString().slice(0, 10)));
  const streakDays = distinctDays.size;

  const topicStrengths = Object.entries(courseStats).map(([_, val]) => {
    const avgPercent = Math.round(val.percentages.reduce((x, y) => x + y, 0) / val.count);
    return {
      topic: `${val.code} - ${val.title}`,
      accuracy: avgPercent,
      accuracyPercent: avgPercent,
      score: avgPercent,
      testsTaken: val.count,
      status: avgPercent >= 60 ? 'strong' : 'weak',
    };
  });

  const strongTopics = topicStrengths.filter((t) => t.accuracy >= 60);
  const weakTopics = topicStrengths.filter((t) => t.accuracy < 60);

  const weeklyPerformance = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
    const sList = dayScores[day] || [];
    const avg = sList.length > 0 ? Math.round(sList.reduce((x, y) => x + y, 0) / sList.length) : 0;
    return { day, score: avg };
  });

  const recentSessions = combinedAttempts.slice(0, 5).map((a) => ({
    id: a.id,
    attemptId: a.id,
    courseId: a.courseId,
    courseCode: a.courseCode,
    courseTitle: a.courseTitle,
    courses: {
      code: a.courseCode,
      title: a.courseTitle,
    },
    score: a.score,
    totalQuestions: a.totalQuestions,
    scorePercent: a.scorePercent,
    score_percent: a.scorePercent,
    date: a.startedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    completed_at: (a.submittedAt || a.startedAt).toISOString(),
    timeTakenMinutes: Math.max(1, Math.round(a.timeTakenSeconds / 60)),
    passed: a.scorePercent >= 50,
  }));

  const passedTests = combinedAttempts.filter((a) => a.scorePercent >= 50).length;
  const failedTests = totalTests - passedTests;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return {
    totalTests,
    averageScore,
    streakDays,
    timeSpentMinutes,
    passRate,
    passedTests,
    failedTests,
    summary: {
      totalPoints: totalScorePoints,
      testsTaken: totalTests,
      averageScore,
      streakDays,
      timeSpentMinutes,
      passRate,
    },
    topicStrengths,
    strongTopics,
    weakTopics,
    weeklyPerformance,
    recentSessions,
    scoreProgress: combinedAttempts.slice(-5).map((a) => a.scorePercent / 100),
  };
}

export async function getLeaderboard(currentUserId: string) {
  try {
    const topProfiles = await prisma.profile.findMany({
      take: 10,
      include: {
        attempts: {
          where: { status: { in: ['SUBMITTED', 'GRADED', 'EXPIRED'] } },
          select: { score: true },
        },
      },
    });

    const entries = topProfiles.map((p) => {
      const dbPoints = p.attempts.reduce((acc, a) => acc + (a.score || 0) * 10, 0);
      const memAttempts = getUserMemoryAttempts(p.id);
      const memPoints = memAttempts.reduce((acc, a) => acc + (a.score || 0) * 10, 0);
      const totalPoints = Math.max(dbPoints, memPoints);

      return {
        id: p.id,
        name: p.name || 'Student',
        points: totalPoints,
        isCurrentUser: p.id === currentUserId,
      };
    });

    if (!entries.some((e) => e.isCurrentUser)) {
      const userMem = getUserMemoryAttempts(currentUserId);
      const userPoints = userMem.reduce((acc, a) => acc + (a.score || 0) * 10, 0);
      entries.push({
        id: currentUserId,
        name: 'You',
        points: userPoints,
        isCurrentUser: true,
      });
    }

    entries.sort((a, b) => b.points - a.points);
    return {
      entries: entries.map((e, idx) => ({ rank: idx + 1, ...e })),
    };
  } catch (_) {}

  const userMem = getUserMemoryAttempts(currentUserId);
  const userPoints = userMem.reduce((acc, a) => acc + (a.score || 0) * 10, 0);

  return {
    entries: [
      { rank: 1, name: 'You', points: userPoints, isCurrentUser: true },
    ],
  };
}
