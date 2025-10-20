import { useState, useCallback, useMemo } from 'react';

export type PaginationState = {
  totalLeads: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export function usePagination<T>(items: T[], itemsPerPage: number = 5) {
  const [currentPage, setCurrentPage] = useState(1);

  const pagination = useMemo((): PaginationState => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    return {
      totalLeads: items.length,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [items.length, itemsPerPage, currentPage]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    const maxPage = Math.ceil(items.length / itemsPerPage);
    if (page >= 1 && page <= maxPage) {
      setCurrentPage(page);
    }
  }, [items.length, itemsPerPage]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [pagination.hasNextPage]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [pagination.hasPrevPage]);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    setCurrentPage,
    pagination,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    resetPagination,
  };
}
