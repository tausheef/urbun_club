import { create } from 'zustand';

export const useSidebarStore = create((set) => ({
  mobileOpen: false,
  openSidebar: () => set({ mobileOpen: true }),
  closeSidebar: () => set({ mobileOpen: false }),
}));
