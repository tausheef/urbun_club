// src/components/PartyAutocomplete.jsx
import React, { useState, useEffect, useRef } from 'react';
import { consignorAPI, consigneeAPI } from '../utils/api';

// ─── Component ────────────────────────────────────────────────────────────────
// type: 'consignor' | 'consignee'
// value: current name string
// onSelect: called with full record when user picks a suggestion
// onChange: called with synthetic event for normal typing
// All other props passed straight to the input

export default function PartyAutocomplete({
  type = 'consignor',
  name,
  value,
  onChange,
  onKeyDown,
  onSelect,
  'data-nav': dataNav,
  className = '',
  placeholder = '',
}) {
  const [records,     setRecords]     = useState([]);   // all fetched records
  const [filtered,    setFiltered]    = useState([]);   // matching suggestions
  const [open,        setOpen]        = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [fetchError,  setFetchError]  = useState(false);

  const wrapperRef = useRef(null);
  const inputRef   = useRef(null);

  const nameField = type === 'consignor' ? 'consignorName' : 'consigneeName';

  // ── Fetch all records once on mount ──
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const api = type === 'consignor' ? consignorAPI : consigneeAPI;
        const data = await api.getAll();
        // Backend returns array directly or { data: [...] }
        const list = Array.isArray(data) ? data : (data?.data || []);
        // Only keep non-temporary records with a name
        const named = list.filter(r => r[nameField] && r[nameField].trim() !== '');
        setRecords(named);
      } catch {
        setFetchError(true);
      }
    };
    fetchRecords();
  }, [type]);

  // ── Filter on value change ──
  useEffect(() => {
    const q = value?.trim() || '';
    if (q.length === 0) {
      setFiltered([]);
      return;
    }
    const matches = records.filter(r =>
      r[nameField].toLowerCase().startsWith(q.toLowerCase())
    ).slice(0, 8);
    setFiltered(matches);
    setHighlighted(-1);
  }, [value, records]);

  // ── Close on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setHighlighted(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Handle selection ──
  const handleSelect = (record) => {
    onSelect(record);
    setOpen(false);
    setHighlighted(-1);
    inputRef.current?.focus();
  };

  // ── Input change ──
  const handleChange = (e) => {
    onChange(e);
    setOpen(true);
  };

  // ── Keyboard navigation ──
  const handleKeyDown = (e) => {
    if (open && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault(); e.stopPropagation();
        setHighlighted(prev => Math.min(prev + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault(); e.stopPropagation();
        setHighlighted(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' && highlighted >= 0) {
        e.preventDefault(); e.stopPropagation();
        handleSelect(filtered[highlighted]);
        return;
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setHighlighted(-1);
        return;
      }
    }
    if (onKeyDown) onKeyDown(e);
  };

  // ── Bold matched prefix ──
  const renderName = (record, idx) => {
    const fullName  = record[nameField];
    const q         = value?.trim() || '';
    const matchEnd  = q.length;
    const isActive  = idx === highlighted;

    return (
      <>
        <span className={`font-bold ${isActive ? 'text-white' : 'text-blue-600'}`}>
          {fullName.slice(0, matchEnd)}
        </span>
        {fullName.slice(matchEnd)}
      </>
    );
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => filtered.length > 0 && setOpen(true)}
        data-nav={dataNav}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
          {filtered.map((record, idx) => {
            const isActive = idx === highlighted;
            return (
              <li
                key={record._id}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(record); }}
                onMouseEnter={() => setHighlighted(idx)}
                className={`px-3 py-2 cursor-pointer select-none ${
                  isActive ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                {/* Name row */}
                <div className="text-sm">{renderName(record, idx)}</div>

                {/* Sub-info row */}
                <div className={`text-xs mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                  {[record.city, record.state, record.phone].filter(Boolean).join(' · ')}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}