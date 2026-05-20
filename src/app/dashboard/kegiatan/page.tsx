'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import { 
    CalendarDays, ClipboardList, Camera, Plus, Search, Filter, 
    MoreVertical, Pencil, Trash2, Clock, MapPin, User, Save, 
    X, Check, Play, Upload, ChevronLeft, ChevronRight,
    ArrowLeft, BookMarked, ListChecks, Calendar, ExternalLink,
    Video, Image as ImageIcon, Users
} from 'lucide-react';
import Image from 'next/image';

// Types
type Activity = {
    id: number;
    title: string;
    type: 'Taklim' | 'Tahsin' | 'Kegiatan Harian';
    day_of_week?: string;
    scheduled_date?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    facilitator?: string;
    notes?: string;
    is_recurring: boolean;
    is_active: boolean;
    created_at: string;
};

type Participant = {
    id?: number;
    participant_name: string;
    participant_type: string;
    status: 'Hadir' | 'Tidak Hadir' | 'Izin';
    notes: string;
};

type Documentation = {
    id: number;
    title: string;
    description: string | null;
    file_url: string;
    file_type: 'photo' | 'video';
    activity_id: number | null;
    created_at: string;
};

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'] as const;

export default function UnifiedKegiatanPage() {
    const [activeTab, setActiveTab] = useState<'jadwal' | 'manage'>('jadwal');
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterDate, setFilterDate] = useState('');

    // Modal states
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<Activity | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

    // Schedule Form
    const [schedForm, setSchedForm] = useState({
        title: '', type: 'Taklim', day_of_week: 'Senin', scheduled_date: '',
        start_time: '', end_time: '', location: '', facilitator: '',
        notes: '', is_recurring: false, is_active: true
    });
    const [savingSched, setSavingSched] = useState(false);

    // Attendance States
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [savingAttendance, setSavingAttendance] = useState(false);
    const [newParticipantName, setNewParticipantName] = useState('');
    const [newParticipantType, setNewParticipantType] = useState('Umum');
    const [isAttendanceSaved, setIsAttendanceSaved] = useState(false);
    const [presenceCategories, setPresenceCategories] = useState<any[]>([]);

    // Autocomplete States
    const [dbPatients, setDbPatients] = useState<any[]>([]);
    const [dbVisitors, setDbVisitors] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Documentation States
    const [docs, setDocs] = useState<Documentation[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Documentation | null>(null);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadDesc, setUploadDesc] = useState('');
    const [uploadingDocs, setUploadingDocs] = useState(false);

    // --- Data Fetching ---

    const fetchActivities = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(apiUrl('/api/activities'));
            const data = await res.json();
            setActivities(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to fetch activities', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPresenceCategories = useCallback(async () => {
        try {
            const res = await authFetch(apiUrl('/api/presence-categories?is_active=true'));
            const data = await res.json();
            if (Array.isArray(data)) {
                setPresenceCategories(data);
                if (data.length > 0) {
                    setNewParticipantType(data[0].name);
                }
            }
        } catch (e) {
            console.error('Failed to fetch presence categories', e);
        }
    }, []);

    const fetchAttendance = useCallback(async () => {
        if (!selectedActivity) return;
        setLoadingAttendance(true);
        try {
            const res = await authFetch(apiUrl(`/api/activities/${selectedActivity.id}/attendance?attendance_date=${attendanceDate}`));
            const data = await res.json();
            const existing: Participant[] = (Array.isArray(data) ? data : []).map((r: any) => ({
                id: r.id,
                participant_name: r.participant_name,
                participant_type: r.participant_type,
                status: r.status,
                notes: r.notes || '',
            }));
            setParticipants(existing);
            setIsAttendanceSaved(existing.length > 0);
        } catch (e) {
            console.error('Failed to fetch attendance', e);
        } finally {
            setLoadingAttendance(false);
        }
    }, [selectedActivity, attendanceDate]);

    const fetchDocs = useCallback(async () => {
        if (!selectedActivity) return;
        setLoadingDocs(true);
        try {
            const res = await authFetch(apiUrl(`/api/documentation?activity_id=${selectedActivity.id}&activity_date=${attendanceDate}`));
            const data = await res.json();
            setDocs(data);
        } catch (e) {
            console.error('Failed to fetch documentation', e);
        } finally {
            setLoadingDocs(false);
        }
    }, [selectedActivity, attendanceDate]);

    useEffect(() => {
        fetchActivities();
        fetchPresenceCategories();
    }, [fetchActivities, fetchPresenceCategories]);

    useEffect(() => {
        if (newParticipantType === 'Pasien' && dbPatients.length === 0) {
            authFetch(apiUrl('/api/patients'))
                .then(r => r.json())
                .then(data => setDbPatients(Array.isArray(data) ? data : []))
                .catch(e => console.error(e));
        } else if (newParticipantType === 'Penunggu' && dbVisitors.length === 0) {
            authFetch(apiUrl('/api/visitors'))
                .then(r => r.json())
                .then(data => setDbVisitors(Array.isArray(data) ? data : []))
                .catch(e => console.error(e));
        }
    }, [newParticipantType, dbPatients.length, dbVisitors.length]);

    useEffect(() => {
        if (activeTab === 'manage') {
            fetchAttendance();
            fetchDocs();
        }
    }, [activeTab, fetchAttendance, fetchDocs]);

    // --- Actions ---

    const handleSelectActivity = (act: Activity) => {
        setSelectedActivity(act);
        setActiveTab('manage');
        setUploadTitle(act.title);
    };

    const openAddSchedule = () => {
        setEditingSchedule(null);
        setSchedForm({
            title: '', type: 'Taklim', day_of_week: 'Senin', 
            scheduled_date: new Date().toISOString().slice(0, 10),
            start_time: '', end_time: '', location: '', facilitator: '',
            notes: '', is_recurring: false, is_active: true
        });
        setShowScheduleModal(true);
    };

    const openEditSchedule = (s: Activity) => {
        setEditingSchedule(s);
        setSchedForm({
            title: s.title, type: s.type, day_of_week: s.day_of_week || 'Senin',
            scheduled_date: s.scheduled_date ? s.scheduled_date.slice(0, 10) : '',
            start_time: s.start_time || '', end_time: s.end_time || '',
            location: s.location || '', facilitator: s.facilitator || '',
            notes: s.notes || '', is_recurring: !!s.is_recurring, is_active: !!s.is_active,
        });
        setShowScheduleModal(true);
    };

    const handleSaveSchedule = async () => {
        if (!schedForm.title.trim()) return alert('Judul harus diisi');
        setSavingSched(true);
        try {
            const res = editingSchedule
                ? await authFetch(apiUrl(`/api/activities/${editingSchedule.id}`), { 
                    method: 'PUT', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify(schedForm) 
                  })
                : await authFetch(apiUrl('/api/activities'), { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify(schedForm) 
                  });
            if (res.ok) {
                setShowScheduleModal(false);
                fetchActivities();
            } else {
                const e = await res.json();
                alert(e.message || 'Gagal menyimpan');
            }
        } catch {
            alert('Terjadi kesalahan');
        } finally {
            setSavingSched(false);
        }
    };

    const handleDeleteSchedule = async (id: number) => {
        try {
            const res = await authFetch(apiUrl(`/api/activities/${id}`), { method: 'DELETE' });
            if (res.ok) fetchActivities();
        } catch {
            alert('Gagal menghapus');
        } finally {
            setShowDeleteConfirm(null);
        }
    };

    // --- Attendance Logic ---
    const addParticipant = () => {
        if (!newParticipantName.trim()) return;
        setParticipants(p => [...p, { participant_name: newParticipantName.trim(), participant_type: newParticipantType, status: 'Hadir', notes: '' }]);
        setNewParticipantName('');
        setIsAttendanceSaved(false);
    };

    const handleSaveAttendance = async () => {
        if (!selectedActivity) return;
        setSavingAttendance(true);
        try {
            const resData = await authFetch(apiUrl(`/api/activities/${selectedActivity.id}/attendance?attendance_date=${attendanceDate}`));
            const existing = await resData.json();
            for (const r of existing) {
                await authFetch(apiUrl(`/api/activities/${selectedActivity.id}/attendance/${r.id}`), { method: 'DELETE' });
            }

            const records = participants.map(p => ({
                participant_name: p.participant_name,
                participant_type: p.participant_type,
                attendance_date: attendanceDate,
                status: p.status,
                notes: p.notes,
            }));
            
            const res = await authFetch(apiUrl(`/api/activities/${selectedActivity.id}/attendance`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records }),
            });
            if (res.ok) {
                alert('Presensi berhasil disimpan!');
                fetchAttendance();
            }
        } catch {
            alert('Gagal menyimpan presensi');
        } finally {
            setSavingAttendance(false);
        }
    };

    // --- Documentation Logic ---
    const handleUploadDocs = async (e: React.FormEvent) => {
        e.preventDefault();
        if (uploadFiles.length === 0 || !uploadTitle || !selectedActivity) return;
        setUploadingDocs(true);
        try {
            const formData = new FormData();
            formData.append('title', uploadTitle);
            formData.append('description', uploadDesc);
            formData.append('activity_id', selectedActivity.id.toString());
            formData.append('activity_date', attendanceDate);
            uploadFiles.forEach(f => formData.append('files', f));

            const res = await authFetch(apiUrl('/api/documentation'), { method: 'POST', body: formData });
            if (res.ok) {
                setIsUploadOpen(false);
                setUploadFiles([]);
                setUploadDesc('');
                fetchDocs();
            }
        } catch {
            alert('Gagal mengunggah dokumentasi');
        } finally {
            setUploadingDocs(false);
        }
    };

    const handleDeleteDoc = async (id: number) => {
        if (!confirm('Hapus dokumentasi ini?')) return;
        try {
            const res = await authFetch(apiUrl(`/api/documentation/${id}`), { method: 'DELETE' });
            if (res.ok) fetchDocs();
        } catch {
            alert('Gagal menghapus dokumentasi');
        }
    };

    const filteredActivities = activities.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             a.facilitator?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || a.type === filterType;
        const matchesDate = !filterDate || (a.scheduled_date && a.scheduled_date.slice(0, 10) === filterDate);
        return matchesSearch && matchesType && matchesDate;
    });

    const STATUS_COLORS: Record<string, string> = {
        Hadir: 'bg-emerald-100 text-emerald-700',
        'Tidak Hadir': 'bg-rose-100 text-rose-700',
        Izin: 'bg-amber-100 text-amber-700',
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center">
                        <BookMarked size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kegiatan & Pembinaan</h1>
                        <p className="text-slate-500 text-sm">Kelola jadwal, kehadiran, dan dokumentasi dalam satu tempat</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0">
                {activeTab === 'jadwal' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Filters & Add Button */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                            <div className="flex flex-1 gap-2 w-full max-w-xl">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Cari judul atau pemateri..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                                    />
                                </div>
                                <select 
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                                >
                                    <option value="all">Semua Tipe</option>
                                    <option value="Taklim">Taklim</option>
                                    <option value="Tahsin">Tahsin</option>
                                    <option value="Kegiatan Harian">Harian</option>
                                </select>
                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-sm">
                                    <Calendar size={16} className="text-slate-400" />
                                    <input 
                                        type="date" 
                                        value={filterDate} 
                                        onChange={e => setFilterDate(e.target.value)} 
                                        className="text-xs focus:outline-none text-slate-700 bg-transparent" 
                                    />
                                    {filterDate && <button onClick={() => setFilterDate('')} className="text-xs text-rose-500 hover:text-rose-700 font-bold">X</button>}
                                </div>
                            </div>
                            <button 
                                onClick={openAddSchedule}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                            >
                                <Plus size={18} /> Tambah Jadwal
                            </button>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="h-48 bg-white rounded-3xl border border-slate-100 animate-pulse" />
                                ))}
                            </div>
                        ) : filteredActivities.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-20 text-center">
                                <CalendarDays size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-700">Belum ada jadwal</h3>
                                <p className="text-slate-500">Klik tombol "Tambah Jadwal" untuk memulai</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredActivities.map(act => (
                                    <div 
                                        key={act.id}
                                        className={`group relative bg-white rounded-3xl border transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden ${selectedActivity?.id === act.id ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-slate-100'}`}
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    act.type === 'Taklim' ? 'bg-blue-100 text-blue-700' :
                                                    act.type === 'Tahsin' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-purple-100 text-purple-700'
                                                }`}>
                                                    {act.type}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); openEditSchedule(act); }} className="p-1.5 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"><Pencil size={14} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(act.id); }} className="p-1.5 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                            
                                            <h3 className="font-bold text-slate-800 text-lg mb-4 line-clamp-2 leading-tight">{act.title}</h3>
                                            
                                            <div className="space-y-2.5 text-sm text-slate-600">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                        <Calendar size={14} />
                                                    </div>
                                                    <span>{act.day_of_week || 'Insidental'}{act.scheduled_date ? `, ${new Date(act.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : ''}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                        <Clock size={14} />
                                                    </div>
                                                    <span>{act.start_time || '—'}{act.end_time ? ` - ${act.end_time}` : ''}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                        <User size={14} />
                                                    </div>
                                                    <span className="truncate">{act.facilitator || '—'}</span>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-6 border-t border-slate-50">
                                                <button 
                                                    onClick={() => handleSelectActivity(act)}
                                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                                                >
                                                    <ClipboardList size={18} /> Kelola Kegiatan
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'manage' && selectedActivity && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-20">
                        {/* Header Management */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-slate-50/80 backdrop-blur-md z-20 py-2">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setActiveTab('jadwal')}
                                    className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">{selectedActivity.title}</h2>
                                    <p className="text-xs text-slate-500 flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-bold uppercase tracking-wider text-[10px]">{selectedActivity.type}</span>
                                        • {selectedActivity.day_of_week || 'Insidental'} {selectedActivity.start_time && `• ${selectedActivity.start_time}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleSaveAttendance}
                                    disabled={savingAttendance || participants.length === 0}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                                >
                                    <Save size={18} /> {savingAttendance ? 'Menyimpan...' : 'Simpan Presensi'}
                                </button>
                                <button 
                                    onClick={() => setIsUploadOpen(true)}
                                    disabled={!isAttendanceSaved}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:shadow-none"
                                    title={!isAttendanceSaved ? "Simpan presensi terlebih dahulu sebelum mengunggah dokumentasi" : ""}
                                >
                                    <Upload size={18} /> Unggah Dokumentasi
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* PRESENSI SECTION (Left Column) */}
                            <div className="lg:col-span-7 space-y-6">
                                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[700px]">
                                    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                                <ClipboardList size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">Daftar Presensi</h3>
                                                <p className="text-xs text-slate-500">Mencatat kehadiran peserta kegiatan</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
                                            <Calendar size={14} className="text-slate-400" />
                                            <input 
                                                type="date" 
                                                value={attendanceDate}
                                                onChange={(e) => setAttendanceDate(e.target.value)}
                                                className="text-xs font-bold outline-none text-slate-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between gap-4">
                                        <div className="flex-1 flex gap-2 relative">
                                            <div className="relative flex-1">
                                                <input 
                                                    value={newParticipantName}
                                                    onChange={(e) => {
                                                        setNewParticipantName(e.target.value);
                                                        setShowSuggestions(true);
                                                    }}
                                                    onFocus={() => setShowSuggestions(true)}
                                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                    onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                                                    placeholder="Nama Peserta..."
                                                    className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                                {showSuggestions && newParticipantType === 'Pasien' && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 shadow-xl rounded-xl max-h-60 overflow-y-auto z-50">
                                                        {dbPatients.filter(p => p.name.toLowerCase().includes(newParticipantName.toLowerCase())).map(p => (
                                                            <div 
                                                                key={p.id} 
                                                                className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm text-slate-700 flex flex-col border-b border-slate-50 last:border-0"
                                                                onClick={() => {
                                                                    setNewParticipantName(p.name);
                                                                    setShowSuggestions(false);
                                                                }}
                                                            >
                                                                <span className="font-bold">{p.name}</span>
                                                                <span className="text-xs text-slate-400">NIK: {p.nik || '-'}</span>
                                                            </div>
                                                        ))}
                                                        {dbPatients.filter(p => p.name.toLowerCase().includes(newParticipantName.toLowerCase())).length === 0 && (
                                                            <div className="px-4 py-3 text-sm text-slate-500 text-center">Pasien tidak ditemukan</div>
                                                        )}
                                                    </div>
                                                )}
                                                {showSuggestions && newParticipantType === 'Penunggu' && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 shadow-xl rounded-xl max-h-60 overflow-y-auto z-50">
                                                        {dbVisitors.filter(v => v.name.toLowerCase().includes(newParticipantName.toLowerCase())).map(v => (
                                                            <div 
                                                                key={v.id} 
                                                                className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm text-slate-700 flex flex-col border-b border-slate-50 last:border-0"
                                                                onClick={() => {
                                                                    setNewParticipantName(v.name);
                                                                    setShowSuggestions(false);
                                                                }}
                                                            >
                                                                <span className="font-bold">{v.name}</span>
                                                                <span className="text-xs text-slate-400">NIK: {v.nik || '-'}</span>
                                                            </div>
                                                        ))}
                                                        {dbVisitors.filter(v => v.name.toLowerCase().includes(newParticipantName.toLowerCase())).length === 0 && (
                                                            <div className="px-4 py-3 text-sm text-slate-500 text-center">Penunggu tidak ditemukan</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <select 
                                                value={newParticipantType}
                                                onChange={(e) => setNewParticipantType(e.target.value)}
                                                className="bg-white border border-emerald-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            >
                                                {presenceCategories.map((cat) => (
                                                    <option key={cat.id} value={cat.name}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                                {presenceCategories.length === 0 && (
                                                    <>
                                                        <option>Umum</option>
                                                        <option>Pasien</option>
                                                        <option>Penunggu</option>
                                                    </>
                                                )}
                                            </select>
                                            <button 
                                                onClick={addParticipant}
                                                className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                        <div className="hidden sm:flex gap-3 text-[10px] font-black uppercase text-emerald-800">
                                            <div className="px-2 py-1 bg-white rounded-lg border border-emerald-100">Hadir: {participants.filter(p => p.status === 'Hadir').length}</div>
                                            <div className="px-2 py-1 bg-white rounded-lg border border-rose-100 text-rose-700">Absen: {participants.filter(p => p.status === 'Tidak Hadir').length}</div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto">
                                        {loadingAttendance ? (
                                            <div className="flex flex-col items-center justify-center h-64 gap-4">
                                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-slate-400 text-sm animate-pulse">Memuat data...</p>
                                            </div>
                                        ) : participants.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                                                <Users size={48} className="text-slate-100 mb-4" />
                                                <h3 className="font-bold text-slate-700">Presensi Masih Kosong</h3>
                                                <p className="text-slate-500 text-xs mt-1">Tambahkan peserta di atas untuk mulai mencatat.</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase tracking-widest sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left font-bold w-16">#</th>
                                                        <th className="px-6 py-3 text-left font-bold">Peserta</th>
                                                        <th className="px-6 py-3 text-left font-bold">Status</th>
                                                        <th className="px-6 py-3"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {participants.map((p, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="px-6 py-4 text-slate-400 font-medium">{idx + 1}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="font-bold text-slate-800 leading-tight">{p.participant_name}</div>
                                                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{p.participant_type}</div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex gap-1">
                                                                    {(['Hadir', 'Tidak Hadir', 'Izin'] as const).map(st => (
                                                                        <button 
                                                                            key={st}
                                                                            onClick={() => {
                                                                                const next = [...participants];
                                                                                next[idx].status = st;
                                                                                setParticipants(next);
                                                                                setIsAttendanceSaved(false);
                                                                            }}
                                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${p.status === st ? STATUS_COLORS[st] : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                                        >
                                                                            {st.split(' ')[0]}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button 
                                                                    onClick={() => {
                                                                        setParticipants(p => p.filter((_, i) => i !== idx));
                                                                        setIsAttendanceSaved(false);
                                                                    }}
                                                                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* DOKUMENTASI SECTION (Right Column) */}
                            <div className="lg:col-span-5 space-y-6">
                                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[700px]">
                                    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                                <Camera size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">Dokumentasi</h3>
                                                <p className="text-xs text-slate-500">Galeri foto dan video kegiatan</p>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                                            {docs.length} File
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 overflow-y-auto">
                                        {loadingDocs ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {[1,2,4,5,6].map(i => (
                                                    <div key={i} className="aspect-square bg-slate-50 rounded-2xl animate-pulse" />
                                                ))}
                                            </div>
                                        ) : docs.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 px-6 text-center h-full">
                                                <ImageIcon size={48} className="text-slate-100 mb-4" />
                                                <h3 className="font-bold text-slate-700">Belum Ada Dokumentasi</h3>
                                                <p className="text-slate-500 text-xs mt-1">Unggah foto atau video di atas.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                                {docs.map(doc => (
                                                    <div 
                                                        key={doc.id}
                                                        onClick={() => { setSelectedDoc(doc); setIsViewerOpen(true); }}
                                                        className="group aspect-square relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                                                    >
                                                        {doc.file_type === 'photo' ? (
                                                            <Image 
                                                                src={apiUrl(doc.file_url)} 
                                                                alt={doc.title}
                                                                fill
                                                                unoptimized
                                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                                                <Play size={24} className="text-white opacity-50 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                                                                <video className="absolute inset-0 w-full h-full object-cover opacity-40">
                                                                    <source src={apiUrl(doc.file_url)} type="video/mp4" />
                                                                </video>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <p className="text-[10px] text-white font-bold truncate">{doc.title}</p>
                                                        </div>
                                                        <div className="absolute top-2 right-2 flex gap-1">
                                                            <div className="px-1.5 py-0.5 bg-black/40 backdrop-blur-md rounded-lg text-[8px] font-bold text-white uppercase tracking-wider">
                                                                {doc.file_type}
                                                            </div>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id); }}
                                                                className="p-1 bg-rose-500/80 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Modals --- */}

            {/* Schedule CRUD Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={e => e.target === e.currentTarget && setShowScheduleModal(false)}>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col scale-in-center">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h2>
                                <p className="text-xs text-slate-400 mt-0.5 uppercase font-bold tracking-widest">Informasi Kegiatan</p>
                            </div>
                            <button onClick={() => setShowScheduleModal(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-800 rounded-xl transition-colors"><X size={20} /></button>
                        </div>
                        
                        <div className="p-8 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Kegiatan</label>
                                    <input 
                                        value={schedForm.title}
                                        onChange={e => setSchedForm(f => ({ ...f, title: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="cth: Taklim Rutin Mingguan..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tipe</label>
                                    <select 
                                        value={schedForm.type}
                                        onChange={e => setSchedForm(f => ({ ...f, type: e.target.value as any }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    >
                                        <option value="Taklim">Taklim</option>
                                        <option value="Tahsin">Tahsin</option>
                                        <option value="Kegiatan Harian">Kegiatan Harian</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Hari</label>
                                    <select 
                                        value={schedForm.day_of_week}
                                        onChange={e => setSchedForm(f => ({ ...f, day_of_week: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    >
                                        {DAYS.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tanggal (Opsional)</label>
                                    <input 
                                        type="date"
                                        value={schedForm.scheduled_date}
                                        onChange={e => setSchedForm(f => ({ ...f, scheduled_date: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mulai</label>
                                        <input type="time" value={schedForm.start_time} onChange={e => setSchedForm(f => ({ ...f, start_time: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-3 py-3 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Selesai</label>
                                        <input type="time" value={schedForm.end_time} onChange={e => setSchedForm(f => ({ ...f, end_time: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-3 py-3 text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pemateri</label>
                                    <input value={schedForm.facilitator} onChange={e => setSchedForm(f => ({ ...f, facilitator: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Lokasi</label>
                                    <input value={schedForm.location} onChange={e => setSchedForm(f => ({ ...f, location: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Catatan</label>
                                    <textarea value={schedForm.notes} onChange={e => setSchedForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm resize-none" />
                                </div>
                                <div className="flex items-center gap-4 py-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={schedForm.is_recurring} onChange={e => setSchedForm(f => ({ ...f, is_recurring: e.target.checked }))} className="w-4 h-4 accent-emerald-600 rounded-lg" />
                                        <span className="text-sm font-bold text-slate-600 group-hover:text-emerald-600">Berulang</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={schedForm.is_active} onChange={e => setSchedForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-emerald-600 rounded-lg" />
                                        <span className="text-sm font-bold text-slate-600 group-hover:text-emerald-600">Aktif</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex gap-4">
                            <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-white/80 transition-all">Batal</button>
                            <button onClick={handleSaveSchedule} disabled={savingSched} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-60">
                                {savingSched ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center shadow-2xl">
                        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Hapus Jadwal?</h2>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">Seluruh data presensi dan dokumentasi yang terkait akan tetap ada di database, namun jadwal ini akan hilang.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all">Batal</button>
                            <button onClick={() => handleDeleteSchedule(showDeleteConfirm)} className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-sm font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20">Ya, Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Documentation Upload Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={e => e.target === e.currentTarget && setIsUploadOpen(false)}>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">Unggah Dokumentasi</h2>
                            <button onClick={() => setIsUploadOpen(false)} className="p-2 text-slate-400 hover:text-slate-800"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUploadDocs} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pilih Foto / Video</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-emerald-500 transition-colors relative group">
                                    <input 
                                        type="file" 
                                        multiple
                                        accept="image/*,video/mp4"
                                        onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Upload size={24} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">{uploadFiles.length > 0 ? `${uploadFiles.length} file dipilih` : 'Klik untuk memilih file'}</p>
                                        <p className="text-xs text-slate-400">JPG, PNG, atau MP4 (Maks 50MB)</p>
                                    </div>
                                </div>
                                {uploadFiles.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {uploadFiles.map((f, i) => (
                                            <div key={i} className="px-2 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 rounded-lg flex items-center gap-1">
                                                <ImageIcon size={10} /> {f.name.slice(0, 10)}...
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Judul Dokumentasi</label>
                                <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Keterangan (Opsional)</label>
                                <textarea value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                            <button type="submit" disabled={uploadingDocs} className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">
                                {uploadingDocs ? 'Mengunggah...' : 'Unggah Sekarang'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Image/Video Viewer Modal */}
            {isViewerOpen && selectedDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md">
                    <button onClick={() => setIsViewerOpen(false)} className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all z-[110] font-medium">
                        <ArrowLeft size={20} /> Kembali
                    </button>
                    
                    <div className="w-full h-full flex flex-col md:flex-row items-stretch">
                        <div className="flex-1 flex items-center justify-center p-8">
                            {selectedDoc.file_type === 'photo' ? (
                                <img src={apiUrl(selectedDoc.file_url)} alt={selectedDoc.title} className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
                            ) : (
                                <video controls className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl" autoPlay>
                                    <source src={apiUrl(selectedDoc.file_url)} type="video/mp4" />
                                </video>
                            )}
                        </div>
                        <div className="w-full md:w-80 bg-white/10 backdrop-blur-md border-l border-white/10 p-8 text-white">
                            <h2 className="text-xl font-bold mb-2">{selectedDoc.title}</h2>
                            <p className="text-sm text-white/60 leading-relaxed mb-8">{selectedDoc.description || 'Tidak ada keterangan'}</p>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl">
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Unggah Pada</p>
                                    <p className="text-sm font-medium">{new Date(selectedDoc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <a 
                                    href={apiUrl(selectedDoc.file_url)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-900 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all"
                                >
                                    <ExternalLink size={16} /> Buka Asli
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
