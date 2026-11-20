import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authenticateMockUser } from '../data/mock/mockAuth';
import type { User } from '../types/domain';

export type AuthStatus =
    | 'initializing'
    | 'authenticated'
    | 'unauthenticated'
    | 'error';

interface AuthState {
    currentUser: User | null;
    authStatus: AuthStatus;
    initializeAuth: () => void;
    login: (email: string, password: string) => Promise<User>;
    logout: () => void;
    setAuthError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => {
            const setCurrentUser = (user: User | null) => {
                set({
                    currentUser: user,
                    authStatus: user ? 'authenticated' : 'unauthenticated',
                });
            };

            return {
                currentUser: null,
                authStatus: 'initializing',
                initializeAuth: () => {
                    set({
                        authStatus: get().currentUser
                            ? 'authenticated'
                            : 'unauthenticated',
                    });
                },
                login: async (email, password) => {
                    const authenticatedUser = authenticateMockUser(email, password);
                    if (!authenticatedUser) {
                        throw new Error('Sign-in failed. Check your credentials and try again.');
                    }
                    setCurrentUser(authenticatedUser);
                    return authenticatedUser;
                },
                logout: () => setCurrentUser(null),
                setAuthError: () => {
                    set({ authStatus: 'error' });
                },
            };
        },
        {
            name: 'auth-storage',
            partialize: (state) => ({
                currentUser: state.currentUser,
            }),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    state?.setAuthError();
                    return;
                }
                state?.initializeAuth();
            },
        }
    )
);