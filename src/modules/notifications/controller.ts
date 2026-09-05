import type { Request, Response, NextFunction } from 'express';
import * as notificationService from './service.js';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const notifications = await notificationService.getNotifications(userId);
    res.status(200).json({ status: 'success', data: notifications });
  } catch (error) {
    next(error);
  }
}

export async function getNotificationById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const notification = await notificationService.getNotificationById(userId, id);
    res.status(200).json({ status: 'success', data: notification });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await notificationService.markNotificationRead(userId, id);
    res.status(200).json({ status: 'success', message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
}
