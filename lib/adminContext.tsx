'use client';

import { createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  user: User | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  // Admin status is checked on the server - this is just a placeholder
  // Real admin check happens in middleware/admin.ts
  return (
    <AdminContext.Provider value={{ isAdmin: false, isLoading: false, user: null }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
