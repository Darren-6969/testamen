'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface ActiveMemorial {
  numberList: string;
  name: string;
}

interface ActiveMemorialContextValue {
  activeMemorial: ActiveMemorial | null;
  setActiveMemorial: (memorial: ActiveMemorial) => void;
}

const ActiveMemorialContext = createContext<ActiveMemorialContextValue | undefined>(
  undefined
);

export function ActiveMemorialProvider({ children }: { children: ReactNode }) {
  const [activeMemorial, setActiveMemorial] = useState<ActiveMemorial | null>(null);

  return (
    <ActiveMemorialContext.Provider value={{ activeMemorial, setActiveMemorial }}>
      {children}
    </ActiveMemorialContext.Provider>
  );
}

export function useActiveMemorial() {
  const ctx = useContext(ActiveMemorialContext);
  if (!ctx) {
    throw new Error('useActiveMemorial must be used within an ActiveMemorialProvider');
  }
  return ctx;
}