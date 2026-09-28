'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { FilterProvider } from '@/context/FilterContext';

export function Providers({ children }) {
  return (
    <AuthProvider>
      <FilterProvider>
        {children}
      </FilterProvider>
    </AuthProvider>
  );
}
