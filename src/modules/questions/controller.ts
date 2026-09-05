import type { Request, Response, NextFunction } from 'express';
import * as questionService from './service.js';

export async function getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
    const result = await questionService.getQuestionsByCourseId(courseId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
