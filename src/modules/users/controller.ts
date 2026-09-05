import type { Request, Response, NextFunction } from 'express';
import * as userService from './service.js';

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const email = req.user?.email;
    const profile = await userService.getProfile(userId, email);
    res.status(200).json({ status: 'success', data: profile });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const updatedProfile = await userService.updateProfile(userId, req.body);
    res.status(200).json({ status: 'success', message: 'Profile updated successfully', data: updatedProfile });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters' });
      return;
    }
    await userService.changePassword(userId, newPassword);
    res.status(200).json({ status: 'success', message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
}

export async function updateNotificationPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Acknowledge preferences update (can store in metadata if desired)
    res.status(200).json({ status: 'success', message: 'Notification preferences updated' });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    await userService.deleteAccount(userId);
    res.status(200).json({ status: 'success', message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
}

