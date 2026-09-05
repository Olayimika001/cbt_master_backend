import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export const initialCourses = [
  {
    code: 'GST101',
    title: 'Use of English & Communication Skills',
    description: 'Foundational English comprehension, grammatical structures, essay writing, and communicative competence for university students.',
    isFree: true,
  },
  {
    code: 'GST102',
    title: 'Nigerian Peoples & Culture',
    description: 'Historical overview of Nigeria, socio-cultural diversity, evolution of the Nigerian state, inter-group relations, and national unity.',
    isFree: true,
  },
  {
    code: 'GST103',
    title: 'Philosophy, Logic & Human Existence',
    description: 'Scope and branches of philosophy, logic and deductive reasoning, fallacies, ethics, and human existence in society.',
    isFree: true,
  },
  {
    code: 'GST104',
    title: 'Use of Library, Study Skills & ICT',
    description: 'Information retrieval, cataloguing, research techniques, computer systems, internet research, and study skills.',
    isFree: true,
  },
  {
    code: 'MTH101',
    title: 'Elementary Mathematics I: Algebra & Trigonometry',
    description: 'Sets, algebraic expressions, quadratic equations, progressions, binomial theorem, and trigonometric functions.',
    isFree: false,
  },
  {
    code: 'PHY101',
    title: 'General Physics I: Mechanics & Properties of Matter',
    description: 'Vectors, kinematics, dynamics, Newton’s laws of motion, work, energy, rotational dynamics, and elasticity.',
    isFree: false,
  },
  {
    code: 'CHM101',
    title: 'General Chemistry I: Physical & Inorganic Chemistry',
    description: 'Atomic structure, periodic table classification, chemical bonding, states of matter, and stoichiometry.',
    isFree: false,
  },
  {
    code: 'CSC101',
    title: 'Introduction to Computer Science & Algorithms',
    description: 'Fundamentals of computing systems, binary data representation, problem-solving techniques, and introductory algorithms.',
    isFree: true,
  },
];

interface RawOption {
  id: string;
  text: string;
}

interface RawQuestion {
  id?: string;
  courseCode: string;
  topic?: string;
  questionText: string;
  options: RawOption[];
  correctOptionId: string;
  explanation?: string;
}

interface QuestionBankFile {
  questions: RawQuestion[];
}

export async function seedAll() {
  console.log('🚀 Starting database seed...');

  // 1. Seed / Upsert Courses
  console.log('\n--- Seeding Courses ---');
  const courseMap = new Map<string, string>(); // code -> id

  for (const courseData of initialCourses) {
    const course = await prisma.course.upsert({
      where: { code: courseData.code },
      update: {
        title: courseData.title,
        description: courseData.description,
        isFree: courseData.isFree,
      },
      create: {
        code: courseData.code,
        title: courseData.title,
        description: courseData.description,
        isFree: courseData.isFree,
      },
    });
    courseMap.set(course.code, course.id);
    console.log(`✓ Course: [${course.code}] ${course.title} (ID: ${course.id})`);
  }

  // 2. Import Question Bank
  console.log('\n--- Importing Question Bank ---');
  const possiblePaths = [
    path.resolve(process.cwd(), 'gst_question_bank.json'),
    path.resolve(process.cwd(), 'question_bank'),
    path.resolve(process.cwd(), 'src/data/gst_question_bank.json'),
  ];

  let rawContent: string | null = null;
  let resolvedPath = '';

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      rawContent = fs.readFileSync(filePath, 'utf8');
      resolvedPath = filePath;
      break;
    }
  }

  if (!rawContent) {
    console.warn('⚠️ No question bank JSON file found at expected locations. Skipping question import.');
    return;
  }

  console.log(`Reading questions from: ${resolvedPath}`);
  const parsedData: QuestionBankFile = JSON.parse(rawContent);

  if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
    throw new Error('Invalid question bank format: missing "questions" array.');
  }

  const countsByCourse: Record<string, number> = {};

  for (const q of parsedData.questions) {
    const courseCode = q.courseCode?.trim().toUpperCase();
    const courseId = courseMap.get(courseCode);

    if (!courseId) {
      console.warn(`⚠️ Course with code "${courseCode}" not found in database. Skipping question: "${q.questionText.slice(0, 40)}..."`);
      continue;
    }

    const optionsJson = q.options as unknown as Prisma.InputJsonValue;

    // Check if question already exists for this course
    const existingQuestion = await prisma.question.findFirst({
      where: {
        courseId,
        questionText: q.questionText,
      },
    });

    if (existingQuestion) {
      await prisma.question.update({
        where: { id: existingQuestion.id },
        data: {
          topic: q.topic || null,
          options: optionsJson,
          correctOptionId: q.correctOptionId,
          explanation: q.explanation || null,
        },
      });
    } else {
      await prisma.question.create({
        data: {
          courseId,
          topic: q.topic || null,
          questionText: q.questionText,
          options: optionsJson,
          correctOptionId: q.correctOptionId,
          explanation: q.explanation || null,
        },
      });
    }

    countsByCourse[courseCode] = (countsByCourse[courseCode] || 0) + 1;
  }

  console.log('\n--- Question Import Summary ---');
  for (const [code, count] of Object.entries(countsByCourse)) {
    console.log(`✓ ${code}: ${count} questions imported`);
  }
  console.log(`Total questions processed: ${parsedData.questions.length}`);
  console.log('\n🎉 Seeding completed successfully!');
}

async function main() {
  try {
    await seedAll();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.includes('seed')) {
  main();
}
