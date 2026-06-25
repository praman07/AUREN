import { create } from 'zustand';
import { UserDetails } from '../types';
import { mockUsers } from '../mock/users.mock';

interface UserState {
  users: UserDetails[];
  selectedUserId: string | null;
  isInviteModalOpen: boolean;
  isDeactivateAlertOpen: boolean;
  
  // Actions
  setSelectedUserId: (id: string | null) => void;
  setInviteModalOpen: (isOpen: boolean) => void;
  setDeactivateAlertOpen: (isOpen: boolean) => void;
  
  // Mutations
  deactivateUser: (id: string) => Promise<void>;
  reactivateUser: (id: string) => Promise<void>;
  inviteUser: (email: string, role: string, department: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [...mockUsers],
  selectedUserId: null,
  isInviteModalOpen: false,
  isDeactivateAlertOpen: false,
  
  setSelectedUserId: (id) => set({ selectedUserId: id }),
  setInviteModalOpen: (isOpen) => set({ isInviteModalOpen: isOpen }),
  setDeactivateAlertOpen: (isOpen) => set({ isDeactivateAlertOpen: isOpen }),
  
  deactivateUser: async (id) => {
    await new Promise(res => setTimeout(res, 500));
    set((state) => ({
      users: state.users.map(u => u.id === id ? { ...u, status: 'SUSPENDED' } : u),
      isDeactivateAlertOpen: false,
    }));
  },
  
  reactivateUser: async (id) => {
    await new Promise(res => setTimeout(res, 500));
    set((state) => ({
      users: state.users.map(u => u.id === id ? { ...u, status: 'ACTIVE' } : u),
    }));
  },

  inviteUser: async (email, role, department) => {
    await new Promise(res => setTimeout(res, 600));
    const newUser: UserDetails = {
      id: `usr_${Date.now()}`,
      firstName: '',
      lastName: '',
      email,
      organization: 'Current Org',
      department,
      roles: [role as any],
      clearanceLevel: 1,
      status: 'INVITED',
      lastActive: null,
      createdAt: new Date().toISOString(),
    };
    
    set((state) => ({
      users: [newUser, ...state.users],
      isInviteModalOpen: false,
    }));
  }
}));
