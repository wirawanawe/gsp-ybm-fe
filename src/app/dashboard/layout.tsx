'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiUrl, authFetch } from '@/lib/api';
import {
    Users,
    UserCheck,
    BedDouble,
    Ambulance,
    PieChart,
    LogOut,
    Menu,
    X,
    UserPlus,
    Settings,
    User,
    ClipboardList,
    ChevronDown,
    Clock,
    BookOpen,
    CalendarDays,
    Activity,
    HeartPulse,
    Wallet,
    TrendingUp,
    BarChart3,
    ListChecks,
    Stethoscope,
    BookMarked,
    LayoutDashboard,
    Camera,
} from 'lucide-react';

function HeaderClock({ className = '' }: { className?: string }) {
    const [time, setTime] = useState('');
    useEffect(() => {
        const format = () => {
            const d = new Date();
            setTime(d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        format();
        const t = setInterval(format, 1000);
        return () => clearInterval(t);
    }, []);
    return (
        <div className={`flex items-center gap-2 text-slate-600 text-sm tabular-nums ${className}`.trim()}>
            <Clock size={18} className="text-slate-400" />
            <span>{time}</span>
        </div>
    );
}

const POLL_INTERVAL_MS = 30000;

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Verifikasi Pasien', { body: 'Ada data verifikasi pasien baru' });
        }
    }
}

type SidebarLink = {
    name: string;
    href: string;
    icon: any;
    notificationKey?: 'screening';
    roles?: string[];
};

type SidebarGroup = {
    groupName: string;
    groupIcon: any;
    roles?: string[];
    links: SidebarLink[];
};

// Flat links (non-grouped) — tetap ada
const flatLinks: SidebarLink[] = [
    { name: 'Laporan', href: '/dashboard/reports', icon: PieChart, roles: ['Admin YBM'] },
    { name: 'Pendaftaran', href: '/dashboard/register', icon: UserPlus, roles: ['Petugas Front Desk', 'Admin YBM'] },
    {
        name: 'Verifikasi Pasien',
        href: '/dashboard/screening',
        icon: UserCheck,
        notificationKey: 'screening',
        roles: ['Petugas Front Desk', 'Sistem Pengelola', 'Admin YBM'],
    },
    { name: 'Data Pasien', href: '/dashboard/patients', icon: User, roles: ['Sistem Pengelola', 'Admin YBM'] },
    { name: 'Data Pendaftar', href: '/dashboard/pendaftar', icon: ClipboardList, roles: ['Petugas Front Desk', 'Sistem Pengelola', 'Admin YBM'] },
    { name: 'Data Penunggu', href: '/dashboard/visitors', icon: Users, roles: ['Sistem Pengelola', 'Admin YBM'] },
    { name: 'Manajemen Kamar', href: '/dashboard/rooms', icon: BedDouble, roles: ['Petugas Front Desk', 'Sistem Pengelola', 'Admin YBM'] },
    { name: 'Logistik Ambulans', href: '/dashboard/ambulance', icon: Ambulance, roles: ['Sistem Pengelola', 'Admin YBM'] },
    { name: 'Setting', href: '/dashboard/settings', icon: Settings, roles: ['Admin YBM'] },
];

// Grouped menus baru
const groupedMenus: SidebarGroup[] = [
    {
        groupName: 'Kegiatan & Pembinaan',
        groupIcon: BookOpen,
        links: [
            { name: 'Dashboard Kegiatan', href: '/dashboard/kegiatan', icon: BookOpen },
        ],
    },
    {
        groupName: 'Layanan Kesehatan',
        groupIcon: Stethoscope,
        links: [
            { name: 'Pencatatan Tensi', href: '/dashboard/kesehatan/tensi', icon: HeartPulse },
            { name: 'Kondisi Pasien', href: '/dashboard/kesehatan/kondisi', icon: Activity },
        ],
    },
    {
        groupName: 'Keuangan',
        groupIcon: Wallet,
        links: [
            { name: 'Dana Masuk', href: '/dashboard/keuangan/pemasukan', icon: TrendingUp },
            { name: 'Pengeluaran', href: '/dashboard/keuangan/pengeluaran', icon: TrendingUp },
            { name: 'Laporan Keuangan', href: '/dashboard/keuangan/laporan', icon: PieChart },
            { name: 'Rekap', href: '/dashboard/keuangan/rekap', icon: BarChart3 },
        ],
    },
];

function SidebarGroupMenu({
    group,
    pathname,
    pendingCount,
}: {
    group: SidebarGroup;
    pathname: string;
    pendingCount: number;
}) {
    const isGroupActive = group.links.some(l => pathname.startsWith(l.href));
    const [open, setOpen] = useState(isGroupActive);
    const Icon = group.groupIcon;

    return (
        <li>
            <button
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${isGroupActive ? 'text-white font-semibold bg-white/10' : 'hover:bg-white/10 hover:text-white'
                    }`}
            >
                <Icon size={18} className={isGroupActive ? 'text-white' : 'text-white/70'} />
                <span className="flex-1 text-sm">{group.groupName}</span>
                <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && (
                <ul className="mt-1 ml-4 pl-3 border-l border-slate-700 space-y-0.5">
                    {group.links.map(link => {
                        const LinkIcon = link.icon;
                        const isActive = pathname.startsWith(link.href);
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm ${isActive
                                            ? 'bg-white/20 text-white font-semibold'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <LinkIcon size={15} className={isActive ? 'text-white' : 'text-white/60'} />
                                    {link.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </li>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [profileOpen, setProfileOpen] = useState(false);
    const prevPendingRef = useRef<number | null>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userDataStr = localStorage.getItem('user');
        if (!token || !userDataStr) { router.push('/login'); return; }
        try { setUser(JSON.parse(userDataStr)); } catch { router.push('/login'); }
    }, [router]);

    useEffect(() => {
        if (!user) return;
        const role = user.role as string;
        const accessibleMenus = user.accessible_menus || [];
        const isAdmin = role === 'Admin YBM';

        const hasAccess = (href: string) => {
            if (isAdmin) return true;
            if (accessibleMenus.includes(href)) return true;
            if (href === '/dashboard/kegiatan') {
                return accessibleMenus.some((m: string) => m.startsWith('/dashboard/kegiatan'));
            }
            return false;
        };

        const allowedFlat = flatLinks.filter(l => hasAccess(l.href));
        const allGroupedLinks = groupedMenus.flatMap(g => g.links).filter(l => hasAccess(l.href));
        const allAllowed = [...allowedFlat, ...allGroupedLinks];

        if (!pathname.startsWith('/dashboard')) return;
        // Dashboard root is always allowed
        if (pathname === '/dashboard') return;

        const isAllowed = allAllowed.some(l => pathname.startsWith(l.href));
        if (!isAllowed && allowedFlat.length > 0) {
            // For grouped paths, allow them if they have access
            const isGroupedPath = allGroupedLinks.some(l => pathname.startsWith(l.href));
            if (!isGroupedPath) router.replace(allowedFlat[0].href);
        }
    }, [user, pathname, router]);

    useEffect(() => {
        if (!user) return;
        const fetchPending = async () => {
            try {
                const res = await authFetch(apiUrl('/api/patients/pending-count'));
                const data = await res.json();
                const count = data?.count ?? 0;
                setPendingCount(count);
                if (prevPendingRef.current !== null && count > prevPendingRef.current) playNotificationSound();
                prevPendingRef.current = count;
            } catch { }
        };
        fetchPending();
        const interval = setInterval(fetchPending, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (!user) return null;

    const userRole = user.role as string;
    const accessibleMenus = user.accessible_menus || [];
    const isAdmin = userRole === 'Admin YBM';
    const hasAccess = (href: string) => {
        if (isAdmin) return true;
        if (accessibleMenus.includes(href)) return true;
        if (href === '/dashboard/kegiatan') {
            return accessibleMenus.some((m: string) => m.startsWith('/dashboard/kegiatan'));
        }
        return false;
    };

    const allowedSidebarLinks = flatLinks.filter(l => hasAccess(l.href));
    const allowedGroupedMenus = groupedMenus.map(g => ({
        ...g,
        links: g.links.filter(l => hasAccess(l.href))
    })).filter(g => g.links.length > 0);

    // Find active page name
    const activeFlatLink = allowedSidebarLinks.find(l => pathname.startsWith(l.href));
    const activeGroupedLink = allowedGroupedMenus.flatMap(g => g.links).find(l => pathname.startsWith(l.href));
    const activePageName = activeFlatLink?.name || activeGroupedLink?.name || 'Dashboard';

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] sm:w-64 bg-[#009bb9] text-white transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="h-full flex flex-col">
                    <div className="h-16 flex items-center px-6 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <Image src="/images/logo.jpg" alt="Logo GSP" width={80} height={80} className="rounded-lg" />
                            <span className="text-xl font-bold text-white tracking-tight">GSP Dashboard</span>
                        </div>
                        <button className="ml-auto md:hidden text-white/70 hover:text-white" onClick={() => setSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 border-b border-white/10">
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-sm text-white/70 mt-1">{user.role}</div>
                    </div>

                    <nav className="flex-1 overflow-y-auto py-3">
                        <ul className="space-y-0.5 px-3">
                            {/* Dashboard link */}
                            <li>
                                <Link
                                    href="/dashboard"
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === '/dashboard' ? 'bg-white/20 text-white font-semibold' : 'hover:bg-white/10 hover:text-white'}`}
                                >
                                    <LayoutDashboard size={18} className={pathname === '/dashboard' ? 'text-white' : 'text-white/70'} />
                                    Dashboard
                                </Link>
                            </li>

                            {/* Separator */}
                            <li className="px-3 pt-3 pb-1">
                                <span className="text-xs font-bold uppercase tracking-widest text-white/50">Operasional</span>
                            </li>

                            {/* Flat links */}
                            {allowedSidebarLinks.map(link => {
                                const Icon = link.icon;
                                const isActive = pathname.startsWith(link.href);
                                const showBadge = link.notificationKey === 'screening' && pendingCount > 0;
                                return (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-white/20 text-white font-semibold' : 'hover:bg-white/10 hover:text-white'}`}
                                        >
                                            <div className="relative">
                                                <Icon size={18} className={isActive ? 'text-white' : 'text-white/70'} />
                                                {showBadge && (
                                                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                                                        {pendingCount > 99 ? '99+' : pendingCount}
                                                    </span>
                                                )}
                                            </div>
                                            {link.name}
                                        </Link>
                                    </li>
                                );
                            })}

                            {/* Separator */}
                            <li className="px-3 pt-3 pb-1">
                                <span className="text-xs font-bold uppercase tracking-widest text-white/50">Program</span>
                            </li>

                            {/* Grouped menus */}
                            {allowedGroupedMenus.map(group => (
                                <SidebarGroupMenu
                                    key={group.groupName}
                                    group={group}
                                    pathname={pathname}
                                    pendingCount={pendingCount}
                                />
                            ))}
                        </ul>
                    </nav>

                    <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-3 px-5 py-2">
                            <HeaderClock className="text-white text-xl" />
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
                    <div className="flex items-center min-w-0">
                        <button className="md:hidden mr-4 text-slate-600 hover:text-slate-900 flex-shrink-0" onClick={() => setSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="font-medium text-slate-800 truncate">{activePageName}</div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen(o => !o)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <User size={18} />
                                </div>
                                <span className="hidden md:inline text-sm font-medium text-slate-700 max-w-[120px] truncate">{user?.name}</span>
                                <ChevronDown size={16} className="text-slate-500" />
                            </button>
                            {profileOpen && (
                                <div className="absolute right-0 top-full mt-1 w-56 py-1 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <p className="font-medium text-slate-800 truncate">{user?.name}</p>
                                        <p className="text-sm text-slate-500 truncate">{user?.role}</p>
                                    </div>
                                    <button
                                        onClick={() => { setProfileOpen(false); handleLogout(); }}
                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        Keluar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
