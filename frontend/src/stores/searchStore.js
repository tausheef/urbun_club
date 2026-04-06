// stores/searchStore.js
import { create } from 'zustand';
import { docketAPI, invoiceAPI } from '../utils/api';

export const useSearchStore = create((set, get) => ({
  searchType: 'DOCKET', // 'DOCKET' or 'E-WAY BILL'
  searchQuery: '',
  searchResults: [],
  loading: false,
  error: null,
  hasSearched: false, // ✅ NEW: Track if user has performed a search

  // Set search type
  setSearchType: (type) => {
    set({ searchType: type, searchResults: [], hasSearched: false });
  },

  // Set search query (only updates input, doesn't search automatically)
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    // ✅ Clear results if query is empty
    if (!query.trim()) {
      set({ searchResults: [], hasSearched: false });
    }
  },

  // Search dockets
  searchDockets: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], error: null, hasSearched: false });
      return;
    }

    set({ loading: true, error: null, hasSearched: true });
    try {
      // ✅ Dedicated search endpoint — no longer fetches all dockets
      const data = await docketAPI.search(query);

      if (data.success && Array.isArray(data.data)) {
        set({ searchResults: data.data, loading: false });
      } else {
        set({ searchResults: [], loading: false });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Search failed';
      set({ error: errorMessage, loading: false });
      console.error('Search dockets error:', error);
    }
  },

  // Search e-way bills
  searchEWayBills: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], error: null, hasSearched: false });
      return;
    }

    set({ loading: true, error: null, hasSearched: true });
    try {
      const data = await invoiceAPI.getAll();

      if (Array.isArray(data)) {
        // Filter invoices with e-way bills based on search query
        const filtered = data.filter(item => {
          if (!item.eWayBill || item.eWayBill.trim() === '') return false;

          const eWayBill = item.eWayBill || '';
          const invoiceNo = item.invoiceNo || '';
          const itemDesc = item.itemDescription || '';

          const searchLower = query.toLowerCase();
          return (
            eWayBill.toLowerCase().includes(searchLower) ||
            invoiceNo.toLowerCase().includes(searchLower) ||
            itemDesc.toLowerCase().includes(searchLower)
          );
        });

        set({ searchResults: filtered, loading: false });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Search failed';
      set({ error: errorMessage, loading: false });
      console.error('Search e-way bills error:', error);
    }
  },

  // ✅ NEW: Execute search based on type (only when user clicks Search or presses Enter)
  executeSearch: async () => {
    const { searchQuery, searchType } = get();
    
    if (!searchQuery.trim()) {
      set({ searchResults: [], error: null, hasSearched: false });
      return;
    }

    if (searchType === 'DOCKET') {
      await get().searchDockets(searchQuery);
    } else if (searchType === 'E-WAY BILL') {
      await get().searchEWayBills(searchQuery);
    }
  },

  // Clear search
  clearSearch: () => {
    set({ searchResults: [], searchQuery: '', error: null, hasSearched: false });
  },
}));