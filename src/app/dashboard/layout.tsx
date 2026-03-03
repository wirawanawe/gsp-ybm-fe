'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
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
    Clock
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

const POLL_INTERVAL_MS = 30000; // 30 detik

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
        // Fallback: browser notification jika Audio API tidak didukung
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
    /**
     * Daftar role yang boleh melihat menu ini.
     * Jika kosong / undefined berarti semua role boleh.
     */
    roles?: string[];
};

const sidebarLinks: SidebarLink[] = [
    // Hanya Admin YBM yang boleh melihat laporan
    { name: 'Laporan', href: '/dashboard/reports', icon: PieChart, roles: ['Admin YBM'] },

    // Petugas Front Desk (RS) + Admin YBM: pendaftaran & verifikasi
    {
        name: 'Pendaftaran',
        href: '/dashboard/register',
        icon: UserPlus,
        roles: ['Petugas Front Desk', 'Admin YBM'],
    },
    {
        name: 'Verifikasi Pasien',
        href: '/dashboard/screening',
        icon: UserCheck,
        notificationKey: 'screening',
        roles: ['Petugas Front Desk', 'Sistem Pengelola', 'Admin YBM'],
    },

    // Sistem Pengelola (Rumah Singgah) + Admin YBM: operasional rumah singgah
    {
        name: 'Data Pasien',
        href: '/dashboard/patients',
        icon: User,
        roles: ['Sistem Pengelola', 'Admin YBM'],
    },
    {
        name: 'Data Pendaftar',
        href: '/dashboard/pendaftar',
        icon: ClipboardList,
        roles: ['Petugas Front Desk', 'Sistem Pengelola', 'Admin YBM'],
    },
    {
        name: 'Data Penunggu',
        href: '/dashboard/visitors',
        icon: Users,
        roles: ['Sistem Pengelola', 'Admin YBM'],
    },
    {
        name: 'Manajemen Kamar',
        href: '/dashboard/rooms',
        icon: BedDouble,
        roles: ['Petugas Front Desk','Sistem Pengelola', 'Admin YBM'],
    },
    {
        name: 'Logistik Ambulans',
        href: '/dashboard/ambulance',
        icon: Ambulance,
        roles: ['Sistem Pengelola', 'Admin YBM'],
    },

    // Hanya Admin YBM yang boleh membuka pengaturan master data
    {
        name: 'Setting',
        href: '/dashboard/settings',
        icon: Settings,
        roles: ['Admin YBM'],
    },
];

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
        // Check authentication
        const token = localStorage.getItem('token');
        const userDataStr = localStorage.getItem('user');

        if (!token || !userDataStr) {
            router.push('/login');
            return;
        }

        try {
            setUser(JSON.parse(userDataStr));
        } catch {
            router.push('/login');
        }
    }, [router]);

    // Batasi akses halaman berdasarkan role (misal: laporan & setting hanya Admin YBM)
    useEffect(() => {
        if (!user) return;
        if (!pathname.startsWith('/dashboard')) return;

        const role = user.role as string;
        const allowedLinks = sidebarLinks.filter(
            (link) => !link.roles || link.roles.includes(role)
        );

        // Jika tidak ada satu pun menu yang boleh, biarkan apa adanya (fallback)
        if (allowedLinks.length === 0) return;

        const isAllowedCurrentPath = allowedLinks.some((link) =>
            pathname.startsWith(link.href)
        );

        // Jika user membuka URL yang tidak sesuai role, arahkan ke menu pertama yang diizinkan
        if (!isAllowedCurrentPath) {
            router.replace(allowedLinks[0].href);
        }
    }, [user, pathname, router]);

    // Poll jumlah pasien pending verifikasi & notifikasi suara saat ada data baru
    useEffect(() => {
        if (!user) return;

        const fetchPending = async () => {
            try {
                const res = await fetch(apiUrl('/api/patients/pending-count'));
                const data = await res.json();
                const count = data?.count ?? 0;
                setPendingCount(count);

                // Bunyikan notifikasi jika jumlah bertambah (data baru masuk)
                if (prevPendingRef.current !== null && count > prevPendingRef.current) {
                    playNotificationSound();
                }
                prevPendingRef.current = count;
            } catch {
                // Ignore network errors saat polling
            }
        };

        fetchPending(); // Fetch segera saat mount
        const interval = setInterval(fetchPending, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (!user) return null; // Or a loading spinner

    const userRole = user.role as string;
    const allowedSidebarLinks = sidebarLinks.filter(
        (link) => !link.roles || link.roles.includes(userRole)
    );

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
            {/* Sidebar - lebar penuh di mobile, 64 di tablet/desktop */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] sm:w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-full flex flex-col">
                    <div className="h-16 flex items-center px-6 border-b border-slate-800">
                        <span className="text-xl font-bold text-white tracking-tight">GSP Dashboard</span>
                        <button
                            className="ml-auto md:hidden text-slate-400 hover:text-white"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 border-b border-slate-800">
                        <div className="font-medium text-slate-100">{user.name}</div>
                        <div className="text-sm text-emerald-400 mt-1">{user.role}</div>
                    </div>

                    <nav className="flex-1 overflow-y-auto py-4">
                        <ul className="space-y-1 px-3">
                            {allowedSidebarLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = pathname.startsWith(link.href);
                                const showBadge = link.notificationKey === 'screening' && pendingCount > 0;
                                return (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                                    ? 'bg-emerald-600/10 text-emerald-400 font-medium'
                                                    : 'hover:bg-slate-800 hover:text-white'
                                                }`}
                                        >
                                            <div className="relative">
                                                <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
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
                        </ul>
                    </nav>

                    <div className="p-4 border-t border-slate-800">
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
                        <button
                            className="md:hidden mr-4 text-slate-600 hover:text-slate-900 flex-shrink-0"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <div className="font-medium text-slate-800 truncate">
                            {allowedSidebarLinks.find(link => pathname.startsWith(link.href))?.name || 'Dashboard'}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen((o) => !o)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <User size={18} />
                                </div>
                                <span className="hidden md:inline text-sm font-medium text-slate-700 max-w-[120px] truncate">
                                    {user?.name}
                                </span>
                                <ChevronDown size={16} className="text-slate-500" />
                            </button>
                            {profileOpen && (
                                <div className="absolute right-0 top-full mt-1 w-56 py-1 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <p className="font-medium text-slate-800 truncate">{user?.name}</p>
                                        <p className="text-sm text-slate-500 truncate">{user?.role}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            handleLogout();
                                        }}
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
