import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as attemptsService from './service.js';
import { saveAnswerSchema, submitAttemptSchema } from './validation.js';

export async function getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courseId = (req.query.courseId || req.params.courseId) as string;
    if (!courseId) {
      res.status(400).json({ error: 'courseId query parameter or route parameter is required' });
      return;
    }
    const questions = await attemptsService.getCourseQuestions(courseId);
    res.status(200).json({ status: 'success', data: questions });
  } catch (error) {
    next(error);
  }
}

export async function startAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const courseId = (req.body.courseId || req.params.courseId) as string;
    if (!courseId) {
      res.status(400).json({ error: 'courseId is required' });
      return;
    }
    const result = await attemptsService.startAttempt(userId, courseId);
    res.status(201).json({ status: 'success', message: 'Attempt started successfully', data: result });
  } catch (error) {
    next(error);
  }
}

export async function getAttemptDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const attemptId = Array.isArray(req.params.attemptId) ? req.params.attemptId[0] : req.params.attemptId;
    const result = await attemptsService.getAttemptDetails(userId, attemptId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}

export async function saveAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const attemptId = Array.isArray(req.params.attemptId) ? req.params.attemptId[0] : req.params.attemptId;
    const questionId = Array.isArray(req.params.questionId) ? req.params.questionId[0] : req.params.questionId;
    const { selectedOptionId } = saveAnswerSchema.parse(req.body);
    const result = await attemptsService.saveAnswer(userId, attemptId, questionId, selectedOptionId);
    res.status(200).json({ status: 'success', message: 'Answer saved successfully', data: result });
  } catch (error) {
    next(error);
  }
}

export async function pauseAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const attemptId = Array.isArray(req.params.attemptId) ? req.params.attemptId[0] : req.params.attemptId;
    const { remainingSeconds, currentIndex, answers } = req.body || {};
    const result = await attemptsService.pauseAttempt(
      userId,
      attemptId,
      remainingSeconds !== undefined ? Number(remainingSeconds) : undefined,
      currentIndex !== undefined ? Number(currentIndex) : undefined,
      Array.isArray(answers) ? answers : undefined
    );
    res.status(200).json({ status: 'success', message: 'Attempt paused successfully', data: result });
  } catch (error) {
    next(error);
  }
}


export async function resumeAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const attemptId = Array.isArray(req.params.attemptId) ? req.params.attemptId[0] : req.params.attemptId;
    const result = await attemptsService.resumeAttempt(userId, attemptId);
    res.status(200).json({ status: 'success', message: 'Attempt resumed successfully', data: result });
  } catch (error) {
    next(error);
  }
}

export async function submitAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const attemptId = Array.isArray(req.params.attemptId) ? req.params.attemptId[0] : req.params.attemptId;
    const bodyKey = req.body?.idempotencyKey;
    const headerKey = req.headers['idempotency-key'] as string | undefined;
    const idempotencyKey = bodyKey || headerKey || uuidv4();
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const timeTakenSeconds = Number(req.body?.timeTakenSeconds) || 1200;

    const result = await attemptsService.submitAttempt(
      userId,
      attemptId,
      idempotencyKey,
      answers,
      timeTakenSeconds
    );
    res.status(200).json({ status: 'success', message: 'Attempt submitted successfully', data: result });
  } catch (error) {
    next(error);
  }
}


export async function getAttemptResult(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const attemptId = Array.isArray(req.params.attemptId) ? req.params.attemptId[0] : req.params.attemptId;
    const result = await attemptsService.getAttemptResult(userId, attemptId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}

export async function getSessionReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const sessionId = (req.params.sessionId || req.params.attemptId) as string;
    const result = await attemptsService.getSessionReview(userId, sessionId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}

export async function getAttemptHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const history = await attemptsService.getAttemptHistory(userId);
    res.status(200).json({ status: 'success', data: history });
  } catch (error) {
    next(error);
  }
}

