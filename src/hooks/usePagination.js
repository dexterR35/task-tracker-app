import { useMemo, useState, useEffect, useCallback } from './useImports';

/**
 * Reusable pagination hook with URL and localStorage sync.
 *
 * @param {Array<any>} items - full list to paginate
 * @param {Object} options
 * @param {number} [options.defaultSize=25]
 * @param {string} [options.queryParamPage='page'] - query param name for page
 * @param {string} [options.queryParamSize='pageSize'] - query param name for page size
 * @param {string} [options.storageKeyPrefix='pg_'] - prefix for localStorage keys
 */
export const usePagination = (items, options = {}) => {
  const {
    defaultSize = 25,
    queryParamPage = 'page',
    queryParamSize = 'pageSize',
    storageKeyPrefix = 'pg_'
  } = options;

  const storagePageKey = `${storageKeyPrefix}${queryParamPage}`;
  const storageSizeKey = `${storageKeyPrefix}${queryParamSize}`;

  const initialPageFromUrl = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = parseInt(params.get(queryParamPage) || localStorage.getItem(storagePageKey) || '0', 10);
      return Number.isFinite(raw) && raw >= 0 ? raw : 0;
    } catch {
      return 0;
    }
  })();

  const initialSizeFromUrl = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = parseInt(params.get(queryParamSize) || localStorage.getItem(storageSizeKey) || String(defaultSize), 10);
      return Number.isFinite(raw) && raw > 0 ? raw : defaultSize;
    } catch {
      return defaultSize;
    }
  })();

  const [page, setPage] = useState(initialPageFromUrl);
  const [pageSize, setPageSize] = useState(initialSizeFromUrl);

  const pageCount = useMemo(() => Math.max(1, Math.ceil((items?.length || 0) / pageSize)), [items, pageSize]);

  useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);

  const syncState = useCallback((nextPage, nextSize) => {
    try {
      const search = new URLSearchParams(window.location.search);
      search.set(queryParamPage, String(nextPage));
      search.set(queryParamSize, String(nextSize));
      const newUrl = `${window.location.pathname}?${search.toString()}${window.location.hash}`;
      window.history.replaceState(null, '', newUrl);
      localStorage.setItem(storagePageKey, String(nextPage));
      localStorage.setItem(storageSizeKey, String(nextSize));
    } catch {
      // no-op in non-browser
    }
  }, [queryParamPage, queryParamSize, storagePageKey, storageSizeKey]);

  const handlePageChange = useCallback((selOrIndex) => {
    const next = typeof selOrIndex === 'number' ? selOrIndex : (selOrIndex?.selected ?? 0);
    setPage(next);
    syncState(next, pageSize);
  }, [pageSize, syncState]);

  const handlePageSizeChange = useCallback((eOrSize) => {
    const raw = typeof eOrSize === 'number' ? eOrSize : parseInt(eOrSize?.target?.value, 10);
    const size = Number.isFinite(raw) && raw > 0 ? raw : defaultSize;
    setPageSize(size);
    setPage(0);
    syncState(0, size);
  }, [defaultSize, syncState]);

  const startIdx = page * pageSize;
  const currentPageItems = useMemo(() => (items || []).slice(startIdx, startIdx + pageSize), [items, startIdx, pageSize]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    currentPageItems,
    handlePageChange,
    handlePageSizeChange,
  };
};

export default usePagination;


