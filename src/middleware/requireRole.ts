import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export function requireRole(requiredRole: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    try {
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
      });

      if (!profile || profile.role !== requiredRole) {
        res.status(403).json({
          error: 'Forbidden',
          message: `${requiredRole.toUpperCase()} privilege required`,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
