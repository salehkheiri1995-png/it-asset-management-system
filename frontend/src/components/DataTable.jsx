import { useState, useMemo } from 'react';

/**
 * Generic reusable DataTable
 * Props:
 *   columns: [{ key, label, render?, sortable?, width? }]
 *   data:    array of row objects
 *   loading: bool
 *   emptyText: string
 *   onRowClick: (row) => void   (optional)
 *   searchable: bool (default true)
 *   searchPlaceholder: string
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyText = 'داده‌ای یافت نشد',
  onRowClick,
  searchable = true,
  searchPlaceholder = 'جستجو...',
  pageSize = 10,
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.trim().toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, query, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), 'fa');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  if (loading) return <TableSkeleton rows={pageSize} cols={columns.length} />;

  return (
    <div className="datatable-wrapper">
      {searchable && (
        <div className="datatable-toolbar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder={searchPlaceholder}
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery('')}>×</button>
            )}
          </div>
          <span className="datatable-count">
            {sorted.length} مورد
          </span>
        </div>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={col.sortable !== false ? 'sortable-th' : ''}
                  onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="sort-arrow">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="table-empty">
                    <span className="table-empty-icon">📦</span>
                    <p>{emptyText}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  className={onRowClick ? 'clickable' : ''}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="datatable-pagination">
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            ‹ قبلی
          </button>
          <span className="page-info">صفحه {page} از {totalPages}</span>
          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            بعدی ›
          </button>
        </div>
      )}
    </div>
  );
}

function TableSkeleton({ rows, cols }) {
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>{Array.from({ length: cols }).map((_, i) => (
            <th key={i}><div className="skeleton skeleton-text" style={{ width: '80%' }} /></th>
          ))}</tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}><div className="skeleton skeleton-text" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
