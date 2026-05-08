'use client';

import { useState, useEffect } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import { 
    Plus, Trash2, Camera, Video, Image as ImageIcon, 
    X, Upload, Search, Filter, Calendar, ExternalLink,
    ChevronLeft, ChevronRight, Play, ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type Documentation = {
    id: number;
    title: string;
    description: string | null;
    file_url: string;
    file_type: 'photo' | 'video';
    activity_id: number | null;
    activity_title?: string;
    created_at: string;
};

export default function DokumentasiPage() {
    const router = useRouter();
    const [docs, setDocs] = useState<Documentation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'photo' | 'video'>('all');
    
    // Modal states
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Documentation | null>(null);
    
    const [viewMode, setViewMode] = useState<'folders' | 'items'>('folders');
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    
    // Form states
    const [uploadLoading, setUploadLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fileType, setFileType] = useState<'photo' | 'video'>('photo');
    const [files, setFiles] = useState<File[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [activityId, setActivityId] = useState<string>('');

    useEffect(() => {
        fetchDocs();
        fetchActivities();
    }, []);

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const res = await authFetch(apiUrl('/api/documentation'));
            const data = await res.json();
            setDocs(data);
        } catch (e) {
            console.error('Failed to fetch documentation', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            const res = await authFetch(apiUrl('/api/activities'));
            const data = await res.json();
            setActivities(data);
        } catch (e) {
            console.error('Failed to fetch activities', e);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0 || !title) return;

        setUploadLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            
            // Note: backend now auto-detects file_type per file, but we keep this for compatibility if needed
            // However, the backend update handles multiple 'files' fields
            files.forEach(f => {
                formData.append('files', f);
            });
            
            if (activityId) formData.append('activity_id', activityId);

            const res = await authFetch(apiUrl('/api/documentation'), {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                setIsUploadOpen(false);
                resetForm();
                fetchDocs();
            } else {
                const data = await res.json();
                alert(data.message || 'Gagal mengunggah file');
            }
        } catch (e) {
            console.error('Upload error:', e);
            alert('Terjadi kesalahan sistem');
        } finally {
            setUploadLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus dokumentasi ini?')) return;

        try {
            const res = await authFetch(apiUrl(`/api/documentation/${id}`), {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchDocs();
                if (selectedDoc?.id === id) {
                    setIsViewerOpen(false);
                    setSelectedDoc(null);
                }
            }
        } catch (e) {
            console.error('Delete error:', e);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setFileType('photo');
        setFiles([]);
        setActivityId('');
    };

    const filteredDocs = docs.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (doc.description?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'all' || doc.file_type === filterType;
        return matchesSearch && matchesType;
    });

    const openViewer = (doc: Documentation) => {
        setSelectedDoc(doc);
        setIsViewerOpen(true);
    };

    // Grouping for Folder View
    const groupedByActivity = docs.reduce((acc, doc) => {
        const key = doc.activity_title || 'Lainnya';
        if (!acc[key]) acc[key] = [];
        acc[key].push(doc);
        return acc;
    }, {} as Record<string, Documentation[]>);

    const folderList = Object.entries(groupedByActivity).map(([title, items]) => ({
        title,
        count: items.length,
        lastUpdated: items[0].created_at,
        preview: items.find(i => i.file_type === 'photo')?.file_url || items[0].file_url
    }));

    const displayDocs = viewMode === 'folders' 
        ? [] 
        : (currentFolder 
            ? groupedByActivity[currentFolder] || []
            : filteredDocs);

    const handleFolderClick = (title: string) => {
        setCurrentFolder(title);
        setViewMode('items');
    };

    const handleBackToFolders = () => {
        setViewMode('folders');
        setCurrentFolder(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Dokumentasi Kegiatan</h1>
                        <p className="text-slate-500 text-sm mt-1">Kelola foto dan video kegiatan & pembinaan</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-emerald-200"
                >
                    <Plus size={20} />
                    Unggah Dokumentasi
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Cari dokumentasi..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === 'all' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        Semua
                    </button>
                    <button 
                        onClick={() => setFilterType('photo')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === 'photo' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        Foto
                    </button>
                    <button 
                        onClick={() => setFilterType('video')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === 'video' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        Video
                    </button>
                </div>
            </div>

            {/* Folder / Items View */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="aspect-square bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : viewMode === 'folders' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {folderList.map(folder => (
                        <div 
                            key={folder.title}
                            onClick={() => handleFolderClick(folder.title)}
                            className="group bg-white rounded-3xl border border-slate-100 p-4 hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1"
                        >
                            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 mb-4 relative">
                                <img 
                                    src={apiUrl(folder.preview)} 
                                    alt={folder.title}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                                    <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-slate-800 flex items-center gap-1">
                                        <ImageIcon size={10} />
                                        {folder.count} Item
                                    </div>
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors truncate">{folder.title}</h3>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Folder Kegiatan</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    <button 
                        onClick={handleBackToFolders}
                        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-medium text-sm transition-colors mb-2"
                    >
                        <ChevronLeft size={20} />
                        Kembali ke Folder
                    </button>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <ImageIcon size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">{currentFolder}</h2>
                            <p className="text-xs text-slate-400">Menampilkan {displayDocs.length} dokumentasi</p>
                        </div>
                    </div>
                    
                    {displayDocs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <ImageIcon size={40} className="text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">Folder ini kosong</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {displayDocs.map(doc => (
                                <div 
                                    key={doc.id} 
                                    className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                                    onClick={() => openViewer(doc)}
                                >
                                    {/* Preview */}
                                    <div className="aspect-square relative bg-slate-900">
                                        {doc.file_type === 'photo' ? (
                                            <img 
                                                src={apiUrl(doc.file_url)} 
                                                alt={doc.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                                    <Play size={24} fill="currentColor" />
                                                </div>
                                                <video className="absolute inset-0 w-full h-full object-cover opacity-40">
                                                    <source src={apiUrl(doc.file_url)} type="video/mp4" />
                                                </video>
                                            </div>
                                        )}
                                        
                                        {/* Badge */}
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                                            {doc.file_type === 'photo' ? <Camera size={12} /> : <Video size={12} />}
                                            {doc.file_type}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-slate-800 text-sm line-clamp-1">{doc.title}</h3>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Calendar size={10} />
                                                {new Date(doc.created_at).toLocaleDateString('id-ID')}
                                            </span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Upload Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-bold text-lg text-slate-800">Unggah Dokumentasi Baru</h2>
                            <button onClick={() => setIsUploadOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpload} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Judul Dokumentasi</label>
                                <input 
                                    type="text" 
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Contoh: Taklim Rutin Selasa"
                                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Tipe File</label>
                                    <div className="flex bg-slate-50 p-1 rounded-xl">
                                        <button 
                                            type="button"
                                            onClick={() => setFileType('photo')}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${fileType === 'photo' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                                        >
                                            Foto
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setFileType('video')}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${fileType === 'video' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                                        >
                                            Video
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Kaitan Kegiatan</label>
                                    <select 
                                        value={activityId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setActivityId(val);
                                            if (val) {
                                                const selected = activities.find(a => a.id === parseInt(val));
                                                if (selected) setTitle(selected.title);
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                                    >
                                        <option value="">Umum (Tanpa Kegiatan)</option>
                                        {activities.map(act => (
                                            <option key={act.id} value={act.id}>{act.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                             <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Pilih File (Bisa Pilih Banyak)</label>
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        multiple
                                        accept="image/*,video/mp4"
                                        onChange={(e) => {
                                            const selected = Array.from(e.target.files || []);
                                            setFiles(prev => [...prev, ...selected]);
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${files.length > 0 ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 group-hover:border-emerald-400 group-hover:bg-slate-50'}`}>
                                        <Upload className={files.length > 0 ? 'text-emerald-600' : 'text-slate-400'} size={32} />
                                        <p className={`text-sm mt-2 font-medium ${files.length > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                                            {files.length > 0 ? `${files.length} file dipilih` : 'Klik atau seret file ke sini'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">Maks. 20 file, total per file 50MB</p>
                                    </div>
                                </div>
                                
                                {files.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-100">
                                        {files.map((f, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-medium text-slate-600">
                                                <span className="truncate max-w-[100px]">{f.name}</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                                                    className="text-rose-500 hover:text-rose-700"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Keterangan (Opsional)</label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tuliskan detail dokumentasi..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                                />
                            </div>

                             <button 
                                type="submit"
                                disabled={uploadLoading || files.length === 0 || !title}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200 mt-2 flex items-center justify-center gap-2"
                            >
                                {uploadLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Mengunggah...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        Simpan Dokumentasi
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Viewer Modal */}
            {isViewerOpen && selectedDoc && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md">
                    <button 
                        onClick={() => setIsViewerOpen(false)}
                        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all z-[80] font-medium"
                    >
                        <ArrowLeft size={20} />
                        Kembali
                    </button>

                    <div className="w-full h-full flex flex-col md:flex-row items-stretch">
                        {/* Media Display */}
                        <div className="flex-1 relative flex items-center justify-center p-4 md:p-12">
                            {selectedDoc.file_type === 'photo' ? (
                                <img 
                                    src={apiUrl(selectedDoc.file_url)} 
                                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                                    alt={selectedDoc.title}
                                />
                            ) : (
                                <video controls autoPlay className="max-w-full max-h-full shadow-2xl rounded-lg">
                                    <source src={apiUrl(selectedDoc.file_url)} type="video/mp4" />
                                    Browser Anda tidak mendukung pemutaran video.
                                </video>
                            )}
                        </div>

                        {/* Sidebar Info (Optional on desktop) */}
                        <div className="w-full md:w-80 bg-white/5 md:bg-white p-6 md:p-8 flex flex-col overflow-y-auto">
                            <div className="mt-auto md:mt-0">
                                <h2 className="text-xl md:text-2xl font-bold text-white md:text-slate-800">{selectedDoc.title}</h2>
                                {selectedDoc.activity_title && (
                                    <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full w-fit">
                                        <Calendar size={14} />
                                        <span className="text-xs font-bold">{selectedDoc.activity_title}</span>
                                    </div>
                                )}
                                <div className="mt-6 space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keterangan</label>
                                        <p className="text-sm text-slate-300 md:text-slate-600 mt-1 leading-relaxed">
                                            {selectedDoc.description || 'Tidak ada keterangan'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diunggah Pada</label>
                                        <p className="text-sm text-slate-300 md:text-slate-600 mt-1">
                                            {new Date(selectedDoc.created_at).toLocaleDateString('id-ID', { 
                                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                            })}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="mt-10 flex gap-3">
                                    <a 
                                        href={apiUrl(selectedDoc.file_url)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 bg-white/10 md:bg-slate-100 hover:bg-white/20 md:hover:bg-slate-200 text-white md:text-slate-700 py-3 rounded-xl font-semibold transition-all"
                                    >
                                        <ExternalLink size={18} />
                                        Buka Asli
                                    </a>
                                    <button 
                                        onClick={() => handleDelete(selectedDoc.id)}
                                        className="w-12 h-12 flex items-center justify-center bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 rounded-xl transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
