import { prisma } from '../../config/prisma.js';
import type {
  CreateCourseInput,
  UpdateCourseInput,
  PaginationQueryInput,
} from './validation.js';

function formatCourse(c: any) {
  const questionCount = c._count?.questions ?? (Array.isArray(c.questions) ? c.questions.length : 0);
  // Courses with questions are free & unlocked; courses without questions are locked & require subscription/payment
  const isFree = questionCount > 0;
  return {
    id: c.id,
    code: c.code,
    title: c.title,
    description: c.description || '',
    is_free: isFree,
    isFree: isFree,
    is_unlocked: isFree,
    isUnlocked: isFree,
    is_locked: !isFree,
    isLocked: !isFree,
    price_amount: isFree ? 0 : 500,
    price: isFree ? 'FREE' : '₦500',
    question_count: questionCount,
    duration_minutes: 30,
    rating: 4.8,
    review_count: 120,
    progress_percent: 0,
    createdAt: c.createdAt,
  };
}

export async function listCourses(pagination: PaginationQueryInput) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      skip,
      take: limit,
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    }),
    prisma.course.count(),
  ]);

  const formatted = courses
    .map(formatCourse)
    .sort((a, b) => {
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;
      return a.code.localeCompare(b.code);
    });

  return {
    status: 'success',
    data: formatted,
    courses: formatted,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}


export async function searchCourses(q: string, pagination: PaginationQueryInput) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where: {
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      skip,
      take: limit,
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    }),
    prisma.course.count({
      where: {
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
    }),
  ]);

  const formatted = courses.map(formatCourse);

  return {
    status: 'success',
    data: formatted,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function filterCourses(isFree: boolean | undefined, pagination: PaginationQueryInput) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const whereClause = isFree !== undefined ? { isFree } : {};

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    }),
    prisma.course.count({ where: whereClause }),
  ]);

  const formatted = courses.map(formatCourse);

  return {
    status: 'success',
    data: formatted,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getCourseById(id: string) {
  // Support lookup by UUID or course code (e.g. GST101)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let course;
  if (isUuid) {
    course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  } else {
    course = await prisma.course.findFirst({
      where: {
        OR: [
          { code: { equals: id, mode: 'insensitive' } },
          { code: { equals: id.replace(/\s+/g, ''), mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  if (!course) {
    const error: any = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  return formatCourse(course);
}

export async function getCourseAccess(userId: string, courseId: string) {
  const course = await getCourseById(courseId);

  if (course.is_free || course.isFree) {
    return {
      status: 'free',
      canStartTest: true,
      expiresAt: null,
      daysRemaining: null,
    };
  }

  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      courseId: course.id,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    },
  });

  if (sub) {
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((sub.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    return {
      status: 'active',
      canStartTest: true,
      expiresAt: sub.expiresAt,
      daysRemaining,
    };
  }

  return {
    status: 'locked',
    canStartTest: false,
    expiresAt: null,
    daysRemaining: 0,
  };
}

export async function createCourse(data: CreateCourseInput) {
  return prisma.course.create({ data });
}

export async function updateCourse(id: string, data: UpdateCourseInput) {
  return prisma.course.update({ where: { id }, data });
}

export async function deleteCourse(id: string) {
  return prisma.course.delete({ where: { id } });
}
