// stores/misReportsStore.js
import { create } from 'zustand';
import { docketAPI, activityAPI, coLoaderAPI } from '../utils/api';
// Normalize: trim + collapse multiple spaces + lowercase
const n = (str) => (str || '').trim().replace(/\s+/g, ' ').toLowerCase();


export const useMisReportsStore = create((set, get) => ({
  clientType: 'Consignor', // 'Consignor' or 'Consignee'
  clientName: '',
  searchResults: [],
  loading: false,
  error: null,

  // Set client type — also clear results when switching modes
  setClientType: (type) => {
    set({ clientType: type, searchResults: [], error: null });
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

    // ✅ TP NAME MODE: search co-loaders by transportName
    if (clientType === 'TPName') {
      try {
        const response = await coLoaderAPI.getAll();
        const allCoLoaders = response?.data || [];

        const filtered = allCoLoaders.filter(item =>
          n(item.transportName).includes(n(clientName))
        );

        const transformedResults = filtered.map((item, idx) => ({
          slno: idx + 1,
          docketId: item.docketId?._id || item.docketId || null,
          docketNo: item.docketId?.docketNo || '-',
          consignee: item.docketId?.consignee?.consigneeName || '-',
          consignor: item.docketId?.consignor?.consignorName || '-',
          transportDocket: item.transportDocket || '-',
          transportName: item.transportName || '-',
          challan: item.challan?.url || null,
          misImageUrl: item.docketId?.misImageUrl || null,
        }));

        set({ searchResults: transformedResults, loading: false });
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Search failed';
        set({ error: errorMessage, loading: false });
        console.error('TP Name search error:', error);
      }
      return;
    }

    // ─── Consignor / Consignee mode ───────────────────────────────────────────
    try {
      // ✅ Dedicated backend endpoint — only fetches matched dockets, not all 184
      const data = await docketAPI.misSearch(clientType, clientName);

      if (!data.success || !Array.isArray(data.data)) {
        console.error('Unexpected API response structure:', data);
        set({ searchResults: [], loading: false });
        return;
      }

      console.log(`Filtered ${data.data.length} dockets for ${clientType}: ${clientName}`);

      if (data.data.length === 0) {
        set({ searchResults: [], loading: false });
        return;
      }

      // Assemble results — all data already joined by backend
      const transformedResults = data.data.map((item, idx) => {
        const hasCoLoader = item.docket?.coLoader === true;

        return {
          slno: idx + 1,
          date: item.docket?.bookingDate
            ? new Date(item.docket.bookingDate).toLocaleDateString('en-IN')
            : '-',
          docketNo: item.docket?.docketNo || '-',
          consignee: item.docket?.consignee?.consigneeName || '-',
          consignor: item.docket?.consignor?.consignorName || '-',
          from: item.bookingInfo?.originCity || '-',
          to: item.docket?.destinationCity || '-',
          invoiceNo: item.invoice?.invoiceNo || '-',
          pkg: item.invoice?.packet || 0,
          weight: item.invoice?.weight || '-',
          mode: item.bookingInfo?.bookingMode || '-',
          status: item.latestStatus || '-',
          deliveryDate: item.docket?.expectedDelivery
            ? new Date(item.docket.expectedDelivery).toLocaleDateString('en-IN')
            : '-',
          pod: item.podUrl || null,
          docketId: item.docket?._id,
          hasCoLoader: hasCoLoader,
          transportName: item.coLoader?.transportName || '-',
          transportDocket: item.coLoader?.transportDocket || '-',
          misImageUrl: item.docket?.misImageUrl || null,
        };
      });

      set({ searchResults: transformedResults, loading: false });

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Search failed';
      set({ error: errorMessage, loading: false });
      console.error('Search error:', error);
    }
  },

  // Clear search
  clearSearch: () => {
    set({ searchResults: [], clientName: '', error: null });
  },
}));