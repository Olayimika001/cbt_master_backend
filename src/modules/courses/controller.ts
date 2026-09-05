import type { Request, Response, NextFunction } from 'express';
import * as courseService from './service.js';
import {
  createCourseSchema,
  updateCourseSchema,
  searchQuerySchema,
  filterQuerySchema,
  paginationQuerySchema,
} from './validation.js';

export async function getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pagination = paginationQuerySchema.parse(req.query);
    const result = await courseService.listCourses(pagination);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function searchCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, page, limit } = searchQuerySchema.parse(req.query);
    const result = await courseService.searchCourses(q, { page, limit });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function filterCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { isFree, page, limit } = filterQuerySchema.parse(req.query);
    const result = await courseService.filterCourses(isFree, { page, limit });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getCourseById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
    const course = await courseService.getCourseById(courseId);
    res.status(200).json({ status: 'success', data: course });
  } catch (error) {
    next(error);
  }
}

export async function checkCourseAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
    const userId = req.user?.id || '';
    const access = await courseService.getCourseAccess(userId, courseId);
    res.status(200).json({ status: 'success', data: access });
  } catch (error) {
    next(error);
  }
}

export async function createCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = createCourseSchema.parse(req.body);
    const course = await courseService.createCourse(validated);
    res.status(201).json({ status: 'success', message: 'Course created successfully', data: course });
  } catch (error) {
    next(error);
  }
}

export async function updateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
    const validated = updateCourseSchema.parse(req.body);
    const course = await courseService.updateCourse(courseId, validated);
    res.status(200).json({ status: 'success', message: 'Course updated successfully', data: course });
  } catch (error) {
    next(error);
  }
}

export async function deleteCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
    await courseService.deleteCourse(courseId);
    res.status(200).json({ status: 'success', message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
}

