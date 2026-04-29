'use client';

import { useState, useEffect } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import {
    Users, BedDouble, Ambulance, Activity, TrendingUp,
    HeartPulse, AlertCircle, CheckCircle2, Clock,
    BookOpen, Wallet, CalendarDays, MapPin, UserCircle2,
    ChevronRight, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

function StatCard({
    title, value, subtitle, icon: Icon, color, href,
}: {
    title: string; value: string | number; subtitle?: string;
    icon: any; color: string; href?: string;
}) {
    const content = (
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow ${href ? 'cursor-pointer' : ''}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-500 font-medium">{title}</p>
                    <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                    {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                    <Icon size={22} className={color} />
                </div>
            </div>
        </div>
    );
    if (href) return <Link href={href}>{content}</Link>;
    return content;
}

function AmbulanceCard({ data }: { data: any }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                    <Ambulance size={20} className="text-sky-600" />
                </div>
                <div>
                    <p className="font-semibold text-slate-800">Status Ambulans</p>
                    <p className="text-xs text-slate-400">Total {data?.total ?? 0} unit</p>
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">Tersedia</span>
                    </div>
                    <span className="text-xl font-bold text-emerald-600">{data?.available ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">Dalam Perjalanan</span>
                    </div>
                    <span className="text-xl font-bold text-amber-600">{data?.in_journey ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">Maintenance</span>
                    </div>
                    <span className="text-xl font-bold text-slate-500">{data?.maintenance ?? 0}</span>
                </div>
            </div>
        </div>
    );
}

function RoomCard({ data }: { data: any }) {
    const pct = data?.total_beds > 0 ? Math.round((data.occupied_beds / data.total_beds) * 100) : 0;
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <BedDouble size={20} className="text-violet-600" />
                </div>
                <div>
                    <p className="font-semibold text-slate-800">Ketersediaan Kamar</p>
                    <p className="text-xs text-slate-400">{data?.total_rooms ?? 0} kamar</p>
                </div>
            </div>
            <div className="mb-3">
                <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-500">Terisi</span>
                    <span className="font-semibold text-slate-700">{pct}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{data?.available_beds ?? 0}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Tersedia</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-rose-600">{data?.occupied_beds ?? 0}</p>
                    <p className="text-xs text-rose-600 mt-0.5">Terisi</p>
                </div>
            </div>
        </div>
    );
}

// ─── Schedule Widget ────────────────────────────────────────────────────────────

const typeConfig: Record<string, { color: string; bg: string; badge: string; href: string }> = {
    'Tahsin': {
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        badge: 'bg-emerald-100 text-emerald-700',
        href: '/dashboard/kegiatan/tahsin',
    },
    'Taklim': {
        color: 'text-teal-700',
        bg: 'bg-teal-50',
        badge: 'bg-teal-100 text-teal-700',
        href: '/dashboard/kegiatan/taklim',
    },
    'Kegiatan Harian': {
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        badge: 'bg-blue-100 text-blue-700',
        href: '/dashboard/kegiatan/harian',
    },
};

function getDayLabel(daysUntil: number | null): { label: string; accent: string } {
    if (daysUntil === null) return { label: '', accent: 'text-slate-400' };
    if (daysUntil === 0) return { label: 'Hari ini', accent: 'text-rose-600' };
    if (daysUntil === 1) return { label: 'Besok', accent: 'text-orange-600' };
    if (daysUntil === 2) return { label: 'Lusa', accent: 'text-amber-600' };
    return { label: `${daysUntil} hari lagi`, accent: 'text-slate-500' };
}

function formatTime(t: string | null) {
    if (!t) return null;
    return t.slice(0, 5); // "HH:MM"
}

const SCHEDULE_TYPES = ['Tahsin', 'Taklim', 'Kegiatan Harian'] as const;
type ScheduleType = typeof SCHEDULE_TYPES[number];

function ScheduleWidget({ schedules, loading }: { schedules: any[]; loading: boolean }) {
    const [activeTab, setActiveTab] = useState<ScheduleType>('Tahsin');

    const grouped: Record<ScheduleType, any[]> = {
        'Tahsin': schedules.filter(s => s.type === 'Tahsin'),
        'Taklim': schedules.filter(s => s.type === 'Taklim'),
        'Kegiatan Harian': schedules.filter(s => s.type === 'Kegiatan Harian'),
    };

    const tabStyles: Record<ScheduleType, { active: string; dot: string }> = {
        'Tahsin':         { active: 'bg-emerald-600 text-white', dot: 'bg-emerald-200' },
        'Taklim':         { active: 'bg-teal-600 text-white',    dot: 'bg-teal-200' },
        'Kegiatan Harian': { active: 'bg-blue-600 text-white',  dot: 'bg-blue-200' },
    };

    const activeItems = grouped[activeTab];
    const cfg = typeConfig[activeTab] || typeConfig['Kegiatan Harian'];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                        <CalendarDays size={20} className="text-violet-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">Jadwal Kegiatan</p>
                        <p className="text-xs text-slate-400">7 hari ke depan</p>
                    </div>
                </div>
                <Link href={cfg.href} className="text-xs text-violet-600 font-medium flex items-center gap-1 hover:underline">
                    Lihat semua <ChevronRight size={14} />
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 mb-4 bg-slate-50 rounded-xl p-1">
                {SCHEDULE_TYPES.map(type => {
                    const isActive = activeTab === type;
                    const count = grouped[type].length;
                    const ts = tabStyles[type];
                    return (
                        <button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isActive ? ts.active + ' shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                            }`}
                        >
                            {type === 'Kegiatan Harian' ? 'Harian' : type}
                            {count > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? ts.dot + ' text-slate-700' : 'bg-slate-200 text-slate-500'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : activeItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <CalendarDays size={36} className="opacity-25 mb-2" />
                    <p className="text-sm">Tidak ada jadwal {activeTab}</p>
                    <p className="text-xs mt-0.5">dalam 7 hari ke depan</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                    {activeItems.map((s: any) => {
                        const startT = formatTime(s.start_time);
                        const endT = formatTime(s.end_time);
                        const { label: dayLabel, accent } = getDayLabel(s.days_until);
                        const dateStr = s.next_date
                            ? new Date(s.next_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
                            : s.day_of_week || '';

                        return (
                            <Link
                                key={s.id}
                                href={cfg.href}
                                className={`flex items-start gap-3 p-3 rounded-xl ${cfg.bg} hover:brightness-95 transition-all group`}
                            >
                                {/* Time + Day */}
                                <div className="min-w-[60px] text-center">
                                    {startT ? (
                                        <>
                                            <p className={`text-sm font-bold ${cfg.color}`}>{startT}</p>
                                            {endT && <p className="text-[10px] text-slate-400 leading-tight">{endT}</p>}
                                        </>
                                    ) : (
                                        <p className="text-xs text-slate-400">—</p>
                                    )}
                                    {dayLabel && (
                                        <p className={`text-[10px] font-semibold mt-0.5 ${accent}`}>{dayLabel}</p>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className={`w-0.5 self-stretch rounded-full ${cfg.color.replace('text-', 'bg-')}`} />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${cfg.color}`}>{s.title}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{dateStr}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        {s.location && (
                                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                                <MapPin size={9} /> {s.location}
                                            </span>
                                        )}
                                        {s.facilitator && (
                                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                                <UserCircle2 size={9} /> {s.facilitator}
                                            </span>
                                        )}
                                        {s.is_recurring && (
                                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                <RefreshCw size={8} /> Rutin
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-slate-300 mt-1 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function DashboardPage() {
    const [summary, setSummary] = useState<any>(null);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingSchedules, setLoadingSchedules] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await authFetch(apiUrl('/api/reports/dashboard-summary'));
                const data = await res.json();
                setSummary(data);
            } catch (e) {
                console.error('Failed to fetch dashboard summary', e);
            } finally {
                setLoadingSummary(false);
            }
        };

        const fetchSchedules = async () => {
            try {
                const res = await authFetch(apiUrl('/api/activities/upcoming'));
                const data = await res.json();
                setSchedules(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error('Failed to fetch upcoming schedules', e);
            } finally {
                setLoadingSchedules(false);
            }
        };

        fetchSummary();
        fetchSchedules();
    }, []);

    if (loadingSummary) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Dashboard GSP YBM</h1>
                <p className="text-slate-500 text-sm mt-1">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Patient Stats */}
            <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Ringkasan Pasien</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                        title="Pasien Aktif"
                        value={summary?.patients?.active ?? 0}
                        subtitle="Sedang dirawat di rumah singgah"
                        icon={Users}
                        color="text-emerald-600"
                    />
                    <StatCard
                        title="Total Pasien Terdaftar"
                        value={summary?.patients?.total ?? 0}
                        subtitle="Semua riwayat pasien"
                        icon={Users}
                        color="text-blue-600"
                    />
                    <StatCard
                        title="Menunggu Verifikasi"
                        value={summary?.patients?.pending ?? 0}
                        subtitle="Perlu tindakan segera"
                        icon={AlertCircle}
                        color="text-amber-600"
                    />
                </div>
            </div>

            {/* Room & Ambulance + Schedule */}
            <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Fasilitas & Jadwal</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <RoomCard data={summary?.rooms} />
                    <AmbulanceCard data={summary?.ambulances} />
                    <ScheduleWidget schedules={schedules} loading={loadingSchedules} />
                </div>
            </div>
        </div>
    );
}
