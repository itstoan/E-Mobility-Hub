import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated' | 'error'

interface AuthState {
    //State
    currentUser: User | null
    authStatus: AuthStatus

    //Actions
    initializeAuth: () => void
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    //setCurrentUser: (user: User | null) => void
    setAuthError: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => {
            // Internal helper: không expose ra component
            const setCurrentUser = (user: User | null) => {
                set({
                    currentUser: user,
                    authStatus: user ? 'authenticated' : 'unauthenticated',
                })
            }

            return {
                currentUser: null,
                authStatus: 'initializing',
                initializeAuth: () => {
                    set({
                        authStatus: get().currentUser
                            ? 'authenticated'
                            : 'unauthenticated',
                    })
                },
                login: async (_email, _password) => {
                    // Sẽ tích hợp Mock User Data sau khi Member B hoàn thành.
                },
                logout: () => setCurrentUser(null),
                setAuthError: () => {
                    set({ authStatus: 'error' })
                },
            }
        },
        {
            name: 'auth-storage',
            partialize: (state) => ({
                currentUser: state.currentUser,
            }),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    state?.setAuthError()
                    return
                }
                state?.initializeAuth()
            },
        },
    ),
)

// placeholder để chạy được, nhớ xóa
export interface User {
    id: string;
    name?: string;
    email?: string;
    role: 'student' | 'operator';
    [key: string]: unknown;
}