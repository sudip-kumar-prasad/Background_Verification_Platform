import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (token, user) => {
    localStorage.setItem('bgv_token', token);
    localStorage.setItem('bgv_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('bgv_token');
    localStorage.removeItem('bgv_user');
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  initialize: () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('bgv_token');
    const userString = localStorage.getItem('bgv_user');
    
    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        set({ token, user, isAuthenticated: true, isLoading: false });
      } catch (e) {
        localStorage.removeItem('bgv_token');
        localStorage.removeItem('bgv_user');
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
