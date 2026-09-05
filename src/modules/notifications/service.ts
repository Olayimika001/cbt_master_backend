import { prisma } from '../../config/prisma.js';

export async function getNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    message: n.body,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function getNotificationById(userId: string, id: string) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    message: notification.body,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function markNotificationRead(userId: string, id: string) {
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
  return { success: true };
}
