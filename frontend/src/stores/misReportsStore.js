// stores/misReportsStore.js
import { create } from 'zustand';
import { docketAPI, activityAPI, coLoaderAPI } from '../utils/api';

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

  // Fetch POD from Activity model
  fetchPODForDocket: async (docketId) => {
    if (!docketId) {
      console.warn('No docketId provided for POD fetch');
      return null;
    }

    try {
      const data = await activityAPI.getByDocket(docketId);
      
      console.log(`POD data for docket ${docketId}:`, data);
      
      if (data.success && data.data && Array.isArray(data.data)) {
        // Find latest "Delivered" activity with POD image
        const deliveredActivities = data.data.filter(
          activity => {
            const hasDeliveredStatus = activity.status === 'Delivered';
            const hasPodImage = activity.podImage?.url;
            
            if (hasDeliveredStatus && !hasPodImage) {
              console.log(`Delivered activity found but no POD image:`, activity);
            }
            
            return hasDeliveredStatus && hasPodImage;
          }
        );

        if (deliveredActivities.length > 0) {
          // Sort by date (latest first)
          const latestDelivered = deliveredActivities.sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          )[0];

          console.log(`POD found for docket ${docketId}:`, latestDelivered.podImage.url);
          return latestDelivered.podImage.url;
        } else {
          console.log(`No delivered activities with POD for docket ${docketId}`);
        }
      }

      return null;
    } catch (error) {
      console.error(`Error fetching POD for docket ${docketId}:`, error);
      return null;
    }
  },

  // Fetch latest activity status for a docket
  fetchLatestStatusForDocket: async (docketId) => {
    if (!docketId) {
      console.warn('No docketId provided for status fetch');
      return '-';
    }

    try {
      const data = await activityAPI.getByDocket(docketId);
      
      if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
        // Sort by date (latest first)
        const sortedActivities = data.data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        // Return the latest status
        return sortedActivities[0].status || '-';
      }

      return '-';
    } catch (error) {
      console.error(`Error fetching status for docket ${docketId}:`, error);
      return '-';
    }
  },

  // ✅ Fetch co-loader data for a docket
  fetchCoLoaderForDocket: async (docketId) => {
    if (!docketId) {
      return null;
    }

    try {
      const response = await coLoaderAPI.getByDocketId(docketId);
      if (response.success && response.data) {
        return {
          transportName: response.data.transportName || '-',
          transportDocket: response.data.transportDocket || '-',
        };
      }
      return null;
    } catch (error) {
      // 404 is expected when docket has no co-loader
      if (error.response?.status !== 404) {
        console.error(`Error fetching co-loader for docket ${docketId}:`, error);
      }
      return null;
    }
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
        // getAll() returns response.data which is { success, count, data: [...] }
        const allCoLoaders = response?.data || [];

        // Filter by transportName (case-insensitive partial match)
        const filtered = allCoLoaders.filter(item =>
          (item.transportName || '').toLowerCase().includes(clientName.trim().toLowerCase())
        );

        // docketId is populated by getAllCoLoaders controller
        // but it only populates docketNo, bookingDate, destinationCity — NOT consignor/consignee refs
        // So we fall back to docket-level fields
        const transformedResults = filtered.map((item, idx) => ({
          slno: idx + 1,
          docketId: item.docketId?._id || item.docketId || null,
          docketNo: item.docketId?.docketNo || '-',
          consignee: item.docketId?.consignee?.consigneeName || '-',
          consignor: item.docketId?.consignor?.consignorName || '-',
          transportDocket: item.transportDocket || '-',
          transportName: item.transportName || '-',
          // challan is stored as { url, publicId } — use the url
          challan: item.challan?.url || null,
          // MIS image URL — if set, docket link goes here instead of /html-to-pdf
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

    // ─── Consignor / Consignee mode (original logic unchanged) ───────────────
    try {
      const data = await docketAPI.getAll({ populate: 'consignor,consignee' });

      console.log('Dockets API response:', data);

      if (data.success && data.data && Array.isArray(data.data)) {
        const activeDockets = data.data.filter(
          item => item.docket?.docketStatus !== 'Cancelled'
        );

        const filtered = activeDockets.filter(item => {
          if (!item.docket) {
            console.warn('Item missing docket data:', item);
            return false;
          }

          if (clientType === 'Consignor') {
            const consignorName = item.docket?.consignor?.consignorName;
            if (!consignorName) {
              console.warn('Docket missing consignor data:', item.docket);
              return false;
            }
            return consignorName.toLowerCase().includes(clientName.toLowerCase());
          } else if (clientType === 'Consignee') {
            const consigneeName = item.docket?.consignee?.consigneeName;
            if (!consigneeName) {
              console.warn('Docket missing consignee data:', item.docket);
              return false;
            }
            return consigneeName.toLowerCase().includes(clientName.toLowerCase());
          }
          return false;
        });

        console.log(`Filtered ${filtered.length} dockets for ${clientType}: ${clientName}`);

        const transformedResults = await Promise.all(
          filtered.map(async (item, idx) => {
            const docketId = item.docket?._id;
            const hasCoLoader = item.docket?.coLoader === true;

            const podUrl = docketId ? await get().fetchPODForDocket(docketId) : null;
            const currentStatus = docketId ? await get().fetchLatestStatusForDocket(docketId) : '-';

            let coLoaderData = null;
            if (hasCoLoader && docketId) {
              coLoaderData = await get().fetchCoLoaderForDocket(docketId);
            }

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
              status: currentStatus,
              deliveryDate: item.docket?.expectedDelivery
                ? new Date(item.docket.expectedDelivery).toLocaleDateString('en-IN')
                : '-',
              pod: podUrl || null,
              docketId: docketId,
              hasCoLoader: hasCoLoader,
              transportName: coLoaderData?.transportName || '-',
              transportDocket: coLoaderData?.transportDocket || '-',
              // MIS image URL — if set, docket link goes here instead of /html-to-pdf
              misImageUrl: item.docket?.misImageUrl || null,
            };
          })
        );

        set({ searchResults: transformedResults, loading: false });
      } else {
        console.error('Unexpected API response structure:', data);
        set({ searchResults: [], loading: false });
      }
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