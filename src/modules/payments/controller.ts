import type { Request, Response, NextFunction } from 'express';
import * as paymentService from './service.js';

export async function initializePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const email = req.user?.email || 'student@cbtmaster.app';
    const { courseId } = req.body;
    if (!courseId) {
      res.status(400).json({ error: 'courseId is required' });
      return;
    }

    const data = await paymentService.initializePayment(userId, email, courseId);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

export async function verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { reference } = req.body;
    if (!reference) {
      res.status(400).json({ error: 'reference is required' });
      return;
    }

    const data = await paymentService.verifyPayment(userId, reference);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}
