import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Package, GitBranch, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { globalSearch } from '../../lib/api';
import { StatusBadge } from './StatusBadge';
import type { SearchResult } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const r = await globalSearch(q);
      setResults(r);
      setSelectedIdx(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIdx]) { handleSelect(results[selectedIdx]); }
  };

  const typeIcons = { product: Package, version: GitBranch, update: FileText };

  if (!isOpen) return null;

  return (
    <div className="aqua-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="aqua-modal aqua-modal-md" style={{ marginTop: '10vh' }}>
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--aqua-border)]">
          <Search size={18} className="text-[var(--aqua-text-muted)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products, versions, updates..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--aqua-text)] placeholder-[var(--aqua-text-muted)]"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="p-1 hover:bg-black/5 rounded">
              <X size={14} />
            </button>
          )}
          <kbd className="text-[10px] text-[var(--aqua-text-muted)] bg-[var(--aqua-bg-solid)] border border-[var(--aqua-border-light)] rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-[#e2e8f0] animate-[aqua-spin_0.8s_linear_infinite]" style={{ borderTopColor: '#3b82f6' }} />
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <p className="text-sm text-[var(--aqua-text-muted)] text-center py-8">No results found for "{query}"</p>
          )}

          {!loading && results.map((r, idx) => {
            const Icon = typeIcons[r.type];
            return (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelect(r)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${idx === selectedIdx ? 'bg-[#3b82f6] text-white' : 'hover:bg-[var(--aqua-hover)]'}`}
              >
                <Icon size={16} className={idx === selectedIdx ? 'text-white' : 'text-[var(--aqua-text-muted)]'} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium m-0 truncate ${idx === selectedIdx ? 'text-white' : 'text-[var(--aqua-text)]'}`}>{r.title}</p>
                  <p className={`text-xs m-0 truncate ${idx === selectedIdx ? 'text-white/70' : 'text-[var(--aqua-text-muted)]'}`}>{r.subtitle}</p>
                </div>
                {r.status && (
                  <StatusBadge status={r.status} size="sm" showLabel={false} />
                )}
                <span className={`text-[10px] uppercase tracking-wider ${idx === selectedIdx ? 'text-white/50' : 'text-[var(--aqua-text-muted)]'}`}>
                  {r.type}
                </span>
              </button>
            );
          })}

          {!loading && !query && (
            <p className="text-sm text-[var(--aqua-text-muted)] text-center py-8">Type to search across all products, versions, and updates</p>
          )}
        </div>
      </div>
    </div>
  );
}
