'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type PublicationStatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

interface PublicationContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: PublicationStatusFilter;
  setStatusFilter: (status: PublicationStatusFilter) => void;
  yearFilter: string;
  setYearFilter: (year: string) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const PublicationContext = createContext<PublicationContextType | undefined>(undefined);

export function PublicationProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PublicationStatusFilter>('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <PublicationContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        yearFilter,
        setYearFilter,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </PublicationContext.Provider>
  );
}

export function usePublicationContext() {
  const context = useContext(PublicationContext);
  if (context === undefined) {
    throw new Error('usePublicationContext must be used within a PublicationProvider');
  }
  return context;
}
