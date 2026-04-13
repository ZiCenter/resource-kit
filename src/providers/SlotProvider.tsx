import { createContext, useContext, type ReactNode } from 'react';
import type { CoreComponentSlots } from '../contracts/component-slots.types';

const SlotContext = createContext<CoreComponentSlots | null>(null);

interface SlotProviderProps {
  slots: CoreComponentSlots;
  children: ReactNode;
}

/**
 * Provides concrete UI component implementations to the core engine.
 * Each consuming app wraps its tree with this provider, passing its
 * own components that match the CoreComponentSlots contract.
 */
export function SlotProvider({ slots, children }: SlotProviderProps) {
  return <SlotContext.Provider value={slots}>{children}</SlotContext.Provider>;
}

/**
 * Access a specific component slot from the provider.
 * Throws if no SlotProvider is present — ensures the consuming app
 * has wired up its UI components.
 */
export function useSlots(): CoreComponentSlots {
  const slots = useContext(SlotContext);
  if (!slots) {
    throw new Error(
      'useSlots must be used within a SlotProvider. Did you forget to wrap your app?',
    );
  }
  return slots;
}
