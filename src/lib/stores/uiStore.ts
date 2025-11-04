// src/lib/stores/uiStore.ts

import { writable } from "svelte/store";

// ✅ NEW: The store's state now includes the open/closed status for all modals.
type UIState = {
  isSidebarOpen: boolean;
  isLoginModalOpen: boolean;
  isRegisterModalOpen: boolean;
  isForgotPasswordModalOpen: boolean;
};

function createUIStore() {
  const { subscribe, update, set } = writable<UIState>({
    isSidebarOpen: false,
    isLoginModalOpen: false,
    isRegisterModalOpen: false,
    isForgotPasswordModalOpen: false,
  });

  const closeAllModals = () =>
    update((state) => ({
      ...state,
      isLoginModalOpen: false,
      isRegisterModalOpen: false,
      isForgotPasswordModalOpen: false,
    }));

  return {
    subscribe,
    // Sidebar methods (unchanged)
    toggleSidebar: () =>
      update((s) => ({ ...s, isSidebarOpen: !s.isSidebarOpen })),
    closeSidebar: () => update((s) => ({ ...s, isSidebarOpen: false })),

    // ✅ NEW: Methods to control modals. They automatically close others first.
    openLoginModal: () => {
      closeAllModals();
      update((s) => ({ ...s, isLoginModalOpen: true }));
    },
    openRegisterModal: () => {
      closeAllModals();
      update((s) => ({ ...s, isRegisterModalOpen: true }));
    },
    openForgotPasswordModal: () => {
      closeAllModals();
      update((s) => ({ ...s, isForgotPasswordModalOpen: true }));
    },
    closeModals: closeAllModals,
  };
}

export const uiStore = createUIStore();
