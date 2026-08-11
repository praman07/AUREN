import { create } from 'zustand';

interface UserState {
  selectedUserId: string | null;
  isInviteModalOpen: boolean;
  isDeactivateAlertOpen: boolean;
  
  // Actions
  setSelectedUserId: (id: string | null) => void;
  setInviteModalOpen: (isOpen: boolean) => void;
  setDeactivateAlertOpen: (isOpen: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  selectedUserId: null,
  isInviteModalOpen: false,
  isDeactivateAlertOpen: false,
  
  setSelectedUserId: (id) => set({ selectedUserId: id }),
  setInviteModalOpen: (isOpen) => set({ isInviteModalOpen: isOpen }),
  setDeactivateAlertOpen: (isOpen) => set({ isDeactivateAlertOpen: isOpen }),
}));
