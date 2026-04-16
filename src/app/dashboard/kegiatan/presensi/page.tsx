'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import { ClipboardList, Check, X, Plus, Save, Trash2, UserPlus } from 'lucide-react';

type Schedule = { id: number; type: string; title: string };
type Participant = {
    id?: number; participant_name: string; participant_type: string;
    status: 'Hadir' | 'Tidak Hadir' | 'Izin'; notes: string;
};

const STATUS_COLORS: Record<string, string> = {
    Hadir: 'bg-emerald-100 text-emerald-700',
    'Tidak Hadir': 'bg-rose-100 text-rose-700',
    Izin: 'bg-amber-100 text-amber-700',
};

export default function PresensiPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [selectedId, setSelectedId] = useState<number | 0>(0);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [existingRecords, setExistingRecords] = useState<any[]>([]);
    const [loadingSched, setLoadingSched] = useState(true);
    const [loadingAtt, setLoadingAtt] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('Umum');

    useEffect(() => {
        const fetch = async () => {
            setLoadingSched(true);
            try {
                const res = await authFetch(apiUrl('/api/activities?is_active=1'));
                const data = await res.json();
                setSchedules(Array.isArray(data) ? data : []);
            } catch { } finally { setLoadingSched(false); }
        };
        fetch();
    }, []);

    const fetchAttendance = useCallback(async () => {
        if (!selectedId) return;
        setLoadingAtt(true);
        try {
            const res = await authFetch(apiUrl(`/api/activities/${selectedId}/attendance?attendance_date=${attendanceDate}`));
            const data = await res.json();
            setExistingRecords(Array.isArray(data) ? data : []);
            // Transform to editable participants
            const existingParticipants: Participant[] = (Array.isArray(data) ? data : []).map((r: any) => ({
                id: r.id,
                participant_name: r.participant_name,
                participant_type: r.participant_type,
                status: r.status,
                notes: r.notes || '',
            }));
            setParticipants(existingParticipants.length > 0 ? existingParticipants : []);
        } catch { } finally { setLoadingAtt(false); }
    }, [selectedId, attendanceDate]);

    useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

    const addParticipant = () => {
        if (!newName.trim()) return;
        setParticipants(p => [...p, { participant_name: newName.trim(), participant_type: newType, status: 'Hadir', notes: '' }]);
        setNewName('');
    };

    const updateStatus = (idx: number, status: Participant['status']) => {
        setParticipants(p => p.map((x, i) => i === idx ? { ...x, status } : x));
    };

    const removeParticipant = (idx: number) => {
        setParticipants(p => p.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        if (!selectedId) return alert('Pilih jadwal kegiatan terlebih dahulu');
        if (participants.length === 0) return alert('Tambahkan minimal 1 peserta');
        setSaving(true);
        try {
            // Kalau sudah ada data, hapus dulu kemudian re-insert (simple approach)
            for (const r of existingRecords) {
                await authFetch(apiUrl(`/api/activities/${selectedId}/attendance/${r.id}`), { method: 'DELETE' });
            }
            const records = participants.map(p => ({
                participant_name: p.participant_name,
                participant_type: p.participant_type,
                attendance_date: attendanceDate,
                status: p.status,
                notes: p.notes,
            }));
            const res = await authFetch(apiUrl(`/api/activities/${selectedId}/attendance`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records }),
            });
            if (res.ok) {
                alert('Presensi berhasil disimpan!');
                fetchAttendance();
            } else {
                const e = await res.json(); alert(e.message || 'Gagal menyimpan');
            }
        } catch { alert('Terjadi kesalahan'); } finally { setSaving(false); }
    };

    const hadir = participants.filter(p => p.status === 'Hadir').length;
    const tidakHadir = participants.filter(p => p.status === 'Tidak Hadir').length;
    const izin = participants.filter(p => p.status === 'Izin').length;

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <ClipboardList size={22} className="text-violet-600" /> Presensi Peserta Kegiatan
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">Catat kehadiran peserta per jadwal kegiatan</p>
            </div>

            {/* Selectors */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Jadwal Kegiatan</label>
                        {loadingSched ? (
                            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                        ) : (
                            <select
                                value={selectedId}
                                onChange={e => setSelectedId(Number(e.target.value))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            >
                                <option value={0}>-- Pilih Jadwal --</option>
                                {schedules.map(s => (
                                    <option key={s.id} value={s.id}>[{s.type}] {s.title}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal Kehadiran</label>
                        <input
                            type="date"
                            value={attendanceDate}
                            onChange={e => setAttendanceDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                </div>
            </div>

            {selectedId > 0 && (
                <>
                    {/* Summary badges */}
                    {participants.length > 0 && (
                        <div className="flex gap-3 flex-wrap">
                            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">✓ Hadir: {hadir}</span>
                            <span className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">✗ Tidak Hadir: {tidakHadir}</span>
                            <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">~ Izin: {izin}</span>
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">Total: {participants.length}</span>
                        </div>
                    )}

                    {/* Add participant */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                        <p className="text-sm font-medium text-slate-700 mb-3">Tambah Peserta</p>
                        <div className="flex gap-2 flex-wrap">
                            <input
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addParticipant()}
                                className="flex-1 min-w-[200px] border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="Nama peserta..."
                            />
                            <select value={newType} onChange={e => setNewType(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                <option>Umum</option>
                                <option>Pasien</option>
                                <option>Penunggu</option>
                            </select>
                            <button onClick={addParticipant} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors">
                                <UserPlus size={15} /> Tambah
                            </button>
                        </div>
                    </div>

                    {/* Participant list */}
                    {loadingAtt ? (
                        <div className="flex justify-center py-8"><div className="w-7 h-7 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
                    ) : participants.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                            <ClipboardList size={36} className="text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500 text-sm">Tambahkan peserta di atas, lalu simpan presensi.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="text-left px-5 py-3 text-slate-600 font-semibold w-8">#</th>
                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">Nama Peserta</th>
                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">Tipe</th>
                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">Status Kehadiran</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {participants.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-5 py-3 text-slate-400">{idx + 1}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{p.participant_name}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{p.participant_type}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1.5">
                                                    {(['Hadir', 'Tidak Hadir', 'Izin'] as const).map(st => (
                                                        <button
                                                            key={st}
                                                            onClick={() => updateStatus(idx, st)}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${p.status === st ? STATUS_COLORS[st] : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                        >
                                                            {st}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => removeParticipant(idx)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {participants.length > 0 && (
                        <div className="flex justify-end">
                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium shadow-sm disabled:opacity-60 transition-colors">
                                <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Presensi'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
