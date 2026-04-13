import type { AppError } from '../errors/errors';
import type { NotificationAdapter } from './NotificationProvider';

/**
 * Console-based notification adapter.
 * Used as the default when no app-specific notification adapter is provided.
 */
export const defaultNotificationAdapter: NotificationAdapter = {
  success: (message: string) => console.log(`[success] ${message}`),
  error: (err: AppError) => console.error(`[error] ${err.message}`),
};
