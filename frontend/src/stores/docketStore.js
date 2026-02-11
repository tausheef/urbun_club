// stores/docketStore.js
import { create } from 'zustand';
import { docketAPI, invoiceAPI } from '../utils/api';

export const useDocketStore = create((set, get) => ({
  dockets: [],
  invoices: [],
  loading: false,
  error: null,

  // Fetch all dockets from API
  fetchDockets: async () => {
    set({ loading: true, error: null });
    try {
      const data = await docketAPI.getAll();

      if (data.success && data.data) {
        // Filter: Only store Active dockets (exclude Cancelled)
        const activeDockets = data.data.filter(
          item => item.docket?.docketStatus !== 'Cancelled'
        );
        
        set({ dockets: activeDockets, loading: false });
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch dockets';
      set({ error: errorMessage, loading: false });
      console.error('Fetch dockets error:', error);
    }
  },

  // Fetch all invoices from API
  fetchInvoices: async () => {
    try {
      const data = await invoiceAPI.getAll();

      if (Array.isArray(data)) {
        set({ invoices: data });
      } else {
        throw new Error('Invalid invoices data format');
      }
    } catch (error) {
      console.error('Fetch invoices error:', error);
    }
  },

  // Get total number of dockets
  getTotalDockets: () => {
    const { dockets } = get();
    return dockets.length;
  },

  // Get delivered dockets count
  getDeliveredCount: () => {
    const { dockets } = get();
    return dockets.filter(item => 
      item.bookingInfo?.deliveryMode === 'Delivered' || 
      item.bookingInfo?.status === 'Delivered'
    ).length;
  },

  // Get pending dockets (expected delivery date is in future or today)
  getPendingCount: () => {
    const { dockets } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dockets.filter(item => {
      const expectedDate = new Date(item.docket?.expectedDelivery);
      return expectedDate >= today;
    }).length;
  },

  // Get undelivered dockets (past expected delivery date but not delivered)
  getUndeliveredCount: () => {
    const { dockets } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dockets.filter(item => {
      const expectedDate = new Date(item.docket?.expectedDelivery);
      return expectedDate < today && 
             item.bookingInfo?.deliveryMode !== 'Delivered' &&
             item.bookingInfo?.status !== 'Delivered';
    }).length;
  },

  // Get RTO (Return To Origin) count
  getRTOCount: () => {
    const { dockets } = get();
    return dockets.filter(item => 
      item.bookingInfo?.deliveryMode === 'RTO' || 
      item.bookingInfo?.status === 'RTO'
    ).length;
  },

  // Get e-way bill count from invoices
  getEWayBillCount: () => {
    const { invoices } = get();
    return invoices.filter(item => 
      item.eWayBill && item.eWayBill.trim() !== ''
    ).length;
  },

  // Clear store
  clearStore: () => {
    set({ dockets: [], invoices: [], loading: false, error: null });
  },
}));