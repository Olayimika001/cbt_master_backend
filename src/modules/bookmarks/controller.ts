import type { Request, Response, NextFunction } from 'express';
import * as bookmarkService from './service.js';

export async function getBookmarks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const bookmarks = await bookmarkService.getBookmarks(userId);
    res.status(200).json({ status: 'success', data: bookmarks });
  } catch (error) {
    next(error);
  }
}

export async function addBookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { questionId } = req.body;
    if (!questionId) {
      res.status(400).json({ error: 'questionId is required' });
      return;
    }
    await bookmarkService.addBookmark(userId, questionId);
    res.status(201).json({ status: 'success', message: 'Bookmark added' });
  } catch (error) {
    next(error);
  }
}

export async function removeBookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const questionId = Array.isArray(req.params.questionId) ? req.params.questionId[0] : req.params.questionId;
    await bookmarkService.removeBookmark(userId, questionId);
    res.status(200).json({ status: 'success', message: 'Bookmark removed' });
  } catch (error) {
    next(error);
  }
}
