import { Outlet } from 'react-router';
import { useAppStore } from '../stores/useAppStore';
// Legacy header preserved for future use if needed:
// import { Header } from './Header';
import { MenuIcon } from './NavIcons';
import { Sidebar } from './Sidebar';

export function MainLayout() {
    const toggleSidebar = useAppStore((state) => state.toggleSidebar);

    return (
        <div className="flex min-h-screen bg-white font-sans text-slate-900">
            <Sidebar />

            <div className="flex min-w-0 flex-1 flex-col">
                {/* <Header /> */}

                {/* Nút mở menu chỉ hiện trên màn hình nhỏ (< md) */}
                <div className="px-4 pt-4 md:hidden">
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        aria-label="Toggle navigation sidebar"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                        <MenuIcon className="h-5 w-5" />
                    </button>
                </div>

                <main className="flex-1 px-6 py-8 sm:px-12 sm:py-10">
                    <div className="mx-auto w-full max-w-6xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}