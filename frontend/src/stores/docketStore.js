// stores/docketStore.js
import { create } from 'zustand';

export const useDocketStore = create((set, get) => ({
  dockets: [],
  invoices: [], // ADD THIS - was missing
  loading: false,
  error: null,

  // Fetch all dockets from API
  fetchDockets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:5000/api/v1/dockets');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dockets');
      }

      const data = await response.json();

      if (data.success && data.data) {
        set({ dockets: data.data, loading: false });
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Fetch error:', error);
    }
  },

  // Fetch all invoices from API
  fetchInvoices: async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/invoices');
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();

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

  // Get delivered dockets
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