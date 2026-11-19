import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types/domain'
import { authenticateMockUser } from '../data/mock/mockAuth'

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
                login: async (email, password) => {
                    const user = authenticateMockUser(email, password)
                    if (!user) {
                        throw new Error('Invalid email or password.')
                    }
                    setCurrentUser(user)
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