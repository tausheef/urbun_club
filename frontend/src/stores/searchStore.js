// stores/searchStore.js
import { create } from 'zustand';
import { docketAPI, invoiceAPI } from '../utils/api';

export const useSearchStore = create((set, get) => ({
  searchType: 'DOCKET', // 'DOCKET' or 'E-WAY BILL'
  searchQuery: '',
  searchResults: [],
  loading: false,
  error: null,

  // Set search type
  setSearchType: (type) => {
    set({ searchType: type });
  },

  // Set search query
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  // Search dockets
  searchDockets: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], error: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const data = await docketAPI.getAll();

      if (data.success && data.data) {
        // Filter dockets based on search query
        const filtered = data.data.filter(item => {
          const docketNo = item.docket?.docketNo || '';
          const originCity = item.bookingInfo?.originCity || '';
          const destinationCity = item.docket?.destinationCity || '';
          const consignorName = item.docket?.consignor?.consignorName || '';
          const consigneeName = item.docket?.consignee?.consigneeName || '';

          const searchLower = query.toLowerCase();
          return (
            docketNo.toLowerCase().includes(searchLower) ||
            originCity.toLowerCase().includes(searchLower) ||
            destinationCity.toLowerCase().includes(searchLower) ||
            consignorName.toLowerCase().includes(searchLower) ||
            consigneeName.toLowerCase().includes(searchLower)
          );
        });

        set({ searchResults: filtered, loading: false });
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
      set({ searchResults: [], error: null });
      return;
    }

    set({ loading: true, error: null });
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

  // Execute search based on type
  executeSearch: async (query, type) => {
    if (type === 'DOCKET') {
      await get().searchDockets(query);
    } else if (type === 'E-WAY BILL') {
      await get().searchEWayBills(query);
    }
  },

  // Clear search
  clearSearch: () => {
    set({ searchResults: [], searchQuery: '', error: null });
  },
}));