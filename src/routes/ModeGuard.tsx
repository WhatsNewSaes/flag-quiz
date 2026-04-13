import type { ReactNode } from 'react';

interface ModeGuardProps {
  modeKey: string;
  children: ReactNode;
}

export function ModeGuard({ children }: ModeGuardProps) {
  return <>{children}</>;
}
