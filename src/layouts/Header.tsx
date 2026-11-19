import { useLocation } from 'react-router';
import { getNavItemsByRole } from '../routes/navigation';
import { useAppStore } from '../stores/useAppStore';
import { useAuthStore } from '../stores/useAuthStore';
import { MenuIcon } from './NavIcons';

interface HeaderProps {
    contextLabel?: string;
}

export function Header({ contextLabel }: HeaderProps) {
    const location = useLocation();
    const toggleSidebar = useAppStore((state) => state.toggleSidebar);
    const currentUser = useAuthStore((state) => state.currentUser);

    const role = currentUser?.role ?? null;
    const navItems = getNavItemsByRole(role);

    const activeNav = navItems.find(
        (item) =>
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`)
    );

    const sectionText =
        contextLabel ??
        (activeNav
            ? `${activeNav.useCases.join(' / ')} — ${activeNav.label}`
            : 'Smart E-Mobility Hub');

    return (
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-8">
            {/* Trái: Nút mở menu trên mobile + Ngữ cảnh Use Case */}
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={toggleSidebar}
                    aria-label="Toggle navigation sidebar"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 md:hidden"
                >
                    <MenuIcon className="h-5 w-5" />
                </button>

                <p className="truncate text-xs font-medium text-slate-500">
                    {sectionText}
                </p>
            </div>

            {/* Phải: Email & Nhãn vai trò chuẩn Figma */}
            <div className="flex items-center gap-4">
                {currentUser?.email && (
                    <span className="hidden text-xs text-slate-400 sm:inline">
                        {currentUser.email}
                    </span>
                )}
                <span className="text-xs font-semibold text-[#0F7657]">
                    {role === 'system_operator'
                        ? 'System Operator · Management'
                        : 'Student · VNU-HCM'}
                </span>
            </div>
        </header>
    );
}