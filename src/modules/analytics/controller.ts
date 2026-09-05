import type { Request, Response, NextFunction } from 'express';
import * as analyticsService from './service.js';

export async function getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const analytics = await analyticsService.getUserAnalytics(userId);
    res.status(200).json({ status: 'success', data: analytics });
  } catch (error) {
    next(error);
  }
}

export async function getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || '';
    const leaderboard = await analyticsService.getLeaderboard(userId);
    res.status(200).json({ status: 'success', data: leaderboard });
  } catch (error) {
    next(error);
  }
}
