import { createContext, useContext, type ReactNode } from 'react';
import type { AppError } from '../errors/errors';

export interface NotificationAdapter {
  success(message: string): void;
  error(error: AppError): void;
}

const NotificationContext = createContext<NotificationAdapter | null>(null);

export function NotificationProvider({
  adapter,
  children,
}: {
  adapter: NotificationAdapter;
  children: ReactNode;
}) {
  return <NotificationContext value={adapter}>{children}</NotificationContext>;
}

export function useNotification(): NotificationAdapter {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
