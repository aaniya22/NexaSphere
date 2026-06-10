import { prisma } from '../lib/prisma';
import { pusherServer } from '../lib/pusher';

export interface NotificationPayload {
  [key: string]: any;
}

/**
 * Service to manage notifications, handling both persistence in PostgreSQL
 * via Prisma and real-time dispatching via Pusher.
 */
export class NotificationService {
  /**
   * Creates a notification record in the database and triggers a real-time WebSocket event.
   *
   * @param params - The parameters to create and dispatch the notification.
   * @param params.userId - The ID of the recipient user.
   * @param params.workspaceId - The ID of the workspace context.
   * @param params.title - The title of the notification.
   * @param params.content - Detailed body content of the notification.
   * @param params.triggerType - The action/event that triggered the notification (e.g. 'COMMENT_ADDED', 'TASK_ASSIGNED').
   * @param params.payload - Dynamic metadata (arbitrary JSON payload).
   * @returns A promise that resolves to the created Notification object.
   *
   * @example
   * ```ts
   * const notification = await NotificationService.sendNotification({
   *   userId: 'user-123',
   *   workspaceId: 'workspace-456',
   *   title: 'New Task Assigned',
   *   content: 'You have been assigned to task "Implement WebSockets"',
   *   triggerType: 'TASK_ASSIGNED',
   *   payload: { taskId: 'task-789' }
   * });
   * ```
   */
  static async sendNotification(params: {
    userId: string;
    workspaceId: string;
    title: string;
    content: string;
    triggerType: string;
    payload?: NotificationPayload;
  }) {
    const { userId, workspaceId, title, content, triggerType, payload = {} } = params;

    // 1. Persist notification in PostgreSQL
    const notification = await prisma.notification.create({
      data: {
        userId,
        workspaceId,
        title,
        content,
        triggerType,
        payload: payload as any,
        isRead: false,
      },
    });

    // 2. Dispatch real-time WebSocket event via Pusher
    try {
      const channel = `user-${userId}`;
      const event = 'notification:new';

      // Trigger event asynchronously. In production, we log errors instead of blocking execution.
      await pusherServer.trigger(channel, event, {
        id: notification.id,
        title: notification.title,
        content: notification.content,
        triggerType: notification.triggerType,
        payload: notification.payload,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        workspaceId: notification.workspaceId,
      });
    } catch (error) {
      console.error(
        `[NotificationService] Error dispatching Pusher event to user-${userId}:`,
        error
      );
    }

    return notification;
  }

  /**
   * Marks a specific notification as read.
   *
   * @param notificationId - The unique identifier of the notification.
   * @param userId - Security context: The user who owns the notification.
   * @param workspaceId - The workspace context.
   * @returns The updated notification record.
   */
  static async markAsRead(notificationId: string, userId: string, workspaceId: string) {
    return prisma.notification.update({
      where: {
        id: notificationId,
        userId,
        workspaceId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marks all unread notifications in a workspace for a specific user as read.
   *
   * @param userId - The user ID.
   * @param workspaceId - The workspace ID.
   * @returns A batch payload containing the number of updated records.
   */
  static async markAllAsRead(userId: string, workspaceId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        workspaceId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Retrieves notifications for a specific user within a workspace, with optional pagination.
   *
   * @param userId - The recipient user ID.
   * @param workspaceId - The workspace context.
   * @param options - Pagination and filter options.
   * @param options.limit - The maximum number of notifications to return. Defaults to 20.
   * @param options.offset - The offset for pagination. Defaults to 0.
   * @param options.onlyUnread - Filter to only return unread notifications.
   * @returns An array of notifications.
   */
  static async getNotifications(
    userId: string,
    workspaceId: string,
    options: { limit?: number; offset?: number; onlyUnread?: boolean } = {}
  ) {
    const { limit = 20, offset = 0, onlyUnread = false } = options;

    return prisma.notification.findMany({
      where: {
        userId,
        workspaceId,
        ...(onlyUnread ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Deletes a notification after verification.
   *
   * @param notificationId - The notification ID.
   * @param userId - The user ID.
   * @param workspaceId - The workspace ID.
   */
  static async deleteNotification(notificationId: string, userId: string, workspaceId: string) {
    return prisma.notification.delete({
      where: {
        id: notificationId,
        userId,
        workspaceId,
      },
    });
  }
}
