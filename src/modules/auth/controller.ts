import type { Request, Response, NextFunction } from 'express';
import * as authService from './service.js';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ status: 'error', message: 'Email and password are required' });
      return;
    }
    const data = await authService.loginUser(email, password);
    res.status(200).json({ status: 'success', message: 'Login successful', data });
  } catch (error: any) {
    res.status(401).json({ status: 'error', message: error.message || 'Authentication failed' });
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) {
      res.status(400).json({ status: 'error', message: 'Email and password are required' });
      return;
    }
    const data = await authService.registerUser(email, password, firstName || 'Student', lastName || '');
    res.status(201).json({ status: 'success', message: 'Registration successful', data });
  } catch (error: any) {
    res.status(400).json({ status: 'error', message: error.message || 'Registration failed' });
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ status: 'error', message: 'Email is required' });
      return;
    }
    const data = await authService.forgotPassword(email);
    res.status(200).json({ status: 'success', message: data.message });
  } catch (error: any) {
    res.status(400).json({ status: 'error', message: error.message || 'Failed to send reset link' });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
}
