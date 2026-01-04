// stores/searchStore.js
import { create } from 'zustand';

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
      const response = await fetch('http://localhost:5000/api/v1/dockets');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dockets');
      }

      const data = await response.json();

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
      set({ error: error.message, loading: false });
      console.error('Search error:', error);
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
      const response = await fetch('http://localhost:5000/api/v1/invoices');
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();

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
      set({ error: error.message, loading: false });
      console.error('Search error:', error);
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