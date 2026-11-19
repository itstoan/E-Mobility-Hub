import { NavLink, useNavigate } from 'react-router';
import { getNavItemsByRole } from '../routes/navigation';
import { ROUTES, getDefaultHomeByRole } from '../routes/paths';
import { useAppStore } from '../stores/useAppStore';
import { useAuthStore } from '../stores/useAuthStore';
import type { User } from '../types/domain';
import {
    BrandBoltIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    LogOutIcon,
    NavItemIcon,
} from './NavIcons';

function getUserBadgeInfo(user: User | null) {
    if (!user) {
        return { label: 'Guest', initials: 'GU' };
    }

    if (user.role === 'system_operator') {
        return {
            label: user.displayName || 'System Operator',
            initials: 'OP',
        };
    }

    const parts = user.displayName.trim().split(/\s+/);
    const initials = parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

    return {
        label: user.displayName || 'Student',
        initials: initials || 'ST',
    };
}

export function Sidebar() {
    const navigate = useNavigate();
    const sidebarOpen = useAppStore((state) => state.sidebarOpen);
    const toggleSidebar = useAppStore((state) => state.toggleSidebar);

    const currentUser = useAuthStore((state) => state.currentUser);
    const logout = useAuthStore((state) => state.logout);

    const role = currentUser?.role ?? null;
    const navItems = getNavItemsByRole(role);
    const userBadge = getUserBadgeInfo(currentUser);

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN, { replace: true });
    };

    return (
        <>
            {/* Backdrop cho thiết bị di động khi mở Sidebar */}
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={toggleSidebar}
                    className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[1px] md:hidden"
                />
            )}

            <aside
                aria-label="Primary Sidebar Navigation"
                className={[
                    'fixed inset-y-0 left-0 z-40 flex flex-col bg-[#071915] font-sans text-white transition-all duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:shrink-0',
                    sidebarOpen
                        ? 'w-72 translate-x-0'
                        : '-translate-x-full md:w-20 md:translate-x-0',
                ].join(' ')}
            >
                {/* Nút tròn thu gọn / mở rộng nằm đè mép phải Sidebar */}
                <button
                    type="button"
                    onClick={toggleSidebar}
                    aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    className="absolute top-1/2 -right-3.5 z-50 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#071915] text-white shadow-md transition-colors hover:bg-[#10382F] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 md:flex"
                >
                    {sidebarOpen ? (
                        <ChevronLeftIcon className="h-4 w-4" />
                    ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                    )}
                </button>

                {/* Brand Logo Header - Font Jura */}
                <div
                    className={[
                        'flex h-24 shrink-0 items-center',
                        sidebarOpen ? 'px-6' : 'justify-center px-2',
                    ].join(' ')}
                >
                    <NavLink
                        to={getDefaultHomeByRole(role)}
                        className="flex items-center gap-3.5 focus:outline-none"
                        title="Smart E-Mobility Hub"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#2AD08C]">
                            <BrandBoltIcon className="h-7 w-7" />
                        </span>

                        {sidebarOpen && (
                            <div className="font-brand leading-snug tracking-wider">
                                <span className="block text-[16px] font-semibold uppercase text-white">
                                    SMART E-MOBILITY
                                </span>
                                <span className="block text-[16px] font-semibold uppercase text-white">
                                    HUB
                                </span>
                            </div>
                        )}
                    </NavLink>
                </div>

                {/* Navigation Links - Font Inter & Căn giữa chiều dọc Sidebar */}
                <nav className="flex flex-1 flex-col justify-center space-y-2 overflow-y-auto px-3.5 py-4 font-sans">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            title={!sidebarOpen ? item.label : undefined}
                            className={({ isActive }) =>
                                [
                                    'group flex items-center rounded-xl py-3.5 text-base font-medium transition-colors',
                                    sidebarOpen ? 'gap-4 px-4' : 'justify-center px-2',
                                    isActive
                                        ? 'bg-[#10382F] text-white'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white',
                                ].join(' ')
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <NavItemIcon
                                        name={item.iconName}
                                        className={[
                                            'h-6 w-6 shrink-0 transition-colors',
                                            isActive
                                                ? 'text-[#2AD08C]'
                                                : 'text-slate-300 group-hover:text-white',
                                        ].join(' ')}
                                    />
                                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User Footer & Logout */}
                <div className="shrink-0 p-4">
                    <div
                        className={[
                            'flex items-center rounded-xl py-2',
                            sidebarOpen ? 'justify-between gap-2.5 px-2' : 'flex-col gap-2.5',
                        ].join(' ')}
                    >
                        <div
                            className="flex min-w-0 items-center gap-3"
                            title={userBadge.label}
                        >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#24332E] text-sm font-semibold text-slate-100 ring-1 ring-white/15">
                                {userBadge.initials}
                            </span>

                            {sidebarOpen && (
                                <div className="min-w-0">
                                    <p className="truncate text-[15px] font-medium text-white">
                                        {userBadge.label}
                                    </p>
                                    <p className="truncate text-xs text-slate-400">
                                        {role === 'system_operator'
                                            ? 'System Operator'
                                            : 'Student Account'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Sign out"
                            aria-label="Sign out"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        >
                            <LogOutIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}