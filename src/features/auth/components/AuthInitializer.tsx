import { useAuthStore } from '../../../stores/useAuthStore'

interface AuthInitializerProps {
    children: React.ReactNode
}

export const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
    const authStatus = useAuthStore((state) => state.authStatus)
    if (authStatus === 'initializing') {
        return ( <div> Loading... </div>)
    }

    return <>{children}</>
}