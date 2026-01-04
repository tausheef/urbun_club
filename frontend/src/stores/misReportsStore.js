// stores/misReportsStore.js
import { create } from 'zustand';

export const useMisReportsStore = create((set, get) => ({
  clientType: 'Consignor', // 'Consignor' or 'Consignee'
  clientName: '',
  searchResults: [],
  loading: false,
  error: null,

  // Set client type
  setClientType: (type) => {
    set({ clientType: type });
  },

  // Set client name
  setClientName: (name) => {
    set({ clientName: name });
  },

  // Search dockets by client
  searchByClient: async (clientType, clientName) => {
    if (!clientName.trim()) {
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
        // Filter based on client type
        const filtered = data.data.filter(item => {
          if (clientType === 'Consignor') {
            return item.docket?.consignor?.consignorName?.toLowerCase().includes(clientName.toLowerCase());
          } else if (clientType === 'Consignee') {
            return item.docket?.consignee?.consigneeName?.toLowerCase().includes(clientName.toLowerCase());
          }
          return false;
        });

        // Transform data to match required columns
        const transformedResults = filtered.map((item, idx) => ({
          slno: idx + 1,
          bookingDate: item.docket?.bookingDate ? new Date(item.docket.bookingDate).toLocaleDateString('en-IN') : '-',
          docketNo: item.docket?.docketNo || '-',
          consignor: item.docket?.consignor?.consignorName || '-',
          consignee: item.docket?.consignee?.consigneeName || '-',
          billingParty: item.bookingInfo?.billingParty || '-',
          originCity: item.bookingInfo?.originCity || '-',
          destinationCity: item.docket?.destinationCity || '-',
          originBranch: item.bookingInfo?.origin || '-',
          destinationBranch: item.bookingInfo?.destinationBranch || '-',
          packetsActual: item.invoice?.packet || 0,
          typeBooking: item.bookingInfo?.bookingType || '-',
          ewayBillNo: item.invoice?.eWayBill || '-',
          invoiceNo: item.invoice?.invoiceNo || '-',
        }));

        set({ searchResults: transformedResults, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Search error:', error);
    }
  },

  // Clear search
  clearSearch: () => {
    set({ searchResults: [], clientName: '', error: null });
  },
}));