'use client';

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SearchBoxWithIcon from '@/components/search/SearchBoxWithIcon';
import Button from '@/components/button/Button';
import DataTable from '@/components/table/DataTable';
import DataTableWithColumnSearch from '@/components/table/DataTableWithColumnSearch';
import { defaultTableConfig, safeLower, TableConfig } from './tableConfig';

interface GenericTablePageProps<T> {
  fetchData?: () => Promise<T[]>;
  fetchDataCursor?: (cursor: string | null, search: Record<string, string>) => Promise<{ data: T[]; nextCursor: string | null }>;
  columns: any[];
  config?: Partial<TableConfig<T>>;
  addRoute?: string;
}

export default function GenericTablePage<T>({
  fetchData,
  fetchDataCursor,
  columns,
  config = {},
  addRoute,
}: GenericTablePageProps<T>) {
  const router = useRouter();
  const finalConfig = { ...defaultTableConfig, ...config };
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const isSearchRef = useRef(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Cursor mode state
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [offsetHistory, setOffsetHistory] = useState<number[]>([0]);

  const serverFiltersRef = useRef<Record<string, string>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCursorMode = !!fetchDataCursor;

  const TableComponent =
    finalConfig.tableType === 'columnSearch'
      ? DataTableWithColumnSearch
      : DataTable;

  const loadCursorPage = useCallback(async (cursor: string | null) => {
    if (!fetchDataCursor) return;
    const isSearch = isSearchRef.current;
    isSearchRef.current = false;
    try {
      if (isSearch) setSearching(true);
      else setLoading(true);
      const result = await fetchDataCursor(cursor, serverFiltersRef.current);
      setData(result.data || []);
      setNextCursor(result.nextCursor);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [fetchDataCursor]);

  const handleFiltersChange = (filters: Record<string, string>) => {
    if (!isCursorMode) return;
    serverFiltersRef.current = filters;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      isSearchRef.current = true;
      setCursorHistory([null]);
      setHistoryIndex(0);
      setNextCursor(null);
      setOffsetHistory([0]);
      loadCursorPage(null);
    }, 400);
  };

  useEffect(() => {
    if (fetchDataCursor) {
      setHistoryIndex(0);
      setCursorHistory([null]);
      setNextCursor(null);
      setOffsetHistory([0]);
      loadCursorPage(null);
    } else if (fetchData) {
      let mounted = true;
      (async () => {
        try {
          setLoading(true);
          const result = await fetchData();
          if (mounted) setData(result || []);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => { mounted = false; };
    }
  }, [fetchData, fetchDataCursor]);

  const handleNext = () => {
    if (!nextCursor) return;
    const newHistory = [...cursorHistory.slice(0, historyIndex + 1), nextCursor];
    const newOffset = offsetHistory[historyIndex] + data.length;
    const newOffsetHistory = [...offsetHistory.slice(0, historyIndex + 1), newOffset];
    setCursorHistory(newHistory);
    setOffsetHistory(newOffsetHistory);
    setHistoryIndex(historyIndex + 1);
    loadCursorPage(nextCursor);
  };

  const handlePrev = () => {
    if (historyIndex === 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    loadCursorPage(cursorHistory[newIndex]);
  };

  const filtered = useMemo(() => {
    return data.filter((row: any) =>
      Object.values(row).some((v) =>
        safeLower(v).includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  useEffect(() => setCurrentPage(1), [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">

  {/* LEFT SIDE */}
  <div>
    {finalConfig.tableType != 'columnSearch' && (
      <SearchBoxWithIcon
        placeholder={finalConfig.searchPlaceholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    )}
  </div>

  {/* RIGHT SIDE */}
  <div className="flex justify-end">
    {addRoute && (
      <Button
        bgColor="#c3195d"
        color="white"
        iconColor="white"
        hoverColor="#a3154d"
        icon={finalConfig.icon}
        onClick={() => router.push(addRoute)}
      >
        {finalConfig.addButtonLabel}
      </Button>
    )}
  </div>

</div>

      {/* Table Wrapper */}
      <div className={`relative transition-opacity duration-150 ${searching ? 'opacity-50 pointer-events-none' : ''}`}>
        <TableComponent
          columns={columns}
          data={filtered}
          currentPage={isCursorMode ? 1 : currentPage}
          pageSize={isCursorMode ? (filtered.length || finalConfig.pageSize) : finalConfig.pageSize}
          onPageChange={isCursorMode ? undefined : setCurrentPage}
          rowOffset={isCursorMode ? offsetHistory[historyIndex] : 0}
          {...(isCursorMode ? { serverSide: true, onFiltersChange: handleFiltersChange } : {})}
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-red-600" />
              <span className="text-sm text-gray-500">Loading data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Cursor pagination controls */}
      {isCursorMode && (
        <div className="flex items-center px-4 py-3 bg-[var(--form-header-bg)]
                        border-t border-[var(--border-color)] text-sm text-[var(--text)]
                        rounded-xl">
          <div className="flex-1 flex justify-start">
            <button
              disabled={historyIndex === 0 || loading}
              onClick={handlePrev}
              className="px-3 py-1 rounded border border-[var(--border-color)]
                         bg-[var(--button-bg)] text-[var(--button-text)]
                         hover:opacity-90 disabled:opacity-50"
            >
              Previous
            </button>
          </div>

          <div className="flex-1 flex justify-center">
            Page {historyIndex + 1}
          </div>

          <div className="flex-1 flex justify-end">
            <button
              disabled={!nextCursor || loading}
              onClick={handleNext}
              className="px-3 py-1 rounded border border-[var(--border-color)]
                         bg-[var(--button-bg)] text-[var(--button-text)]
                         hover:opacity-90 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
