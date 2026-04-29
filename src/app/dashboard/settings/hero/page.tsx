'use client';

import { useState, useEffect } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import { 
    Plus, Trash2, Edit2, Camera, Link as LinkIcon, 
    X, Upload, MoveUp, MoveDown, Save, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

type Slider = {
    id: number;
    title: string;
    subtitle: string | null;
    image_url: string;
    button_text: string | null;
    button_link: string | null;
    order_number: number;
    is_active: boolean;
};

export default function HeroSettingsPage() {
    const [sliders, setSliders] = useState<Slider[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
    const [uploadLoading, setUploadLoading] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [buttonText, setButtonText] = useState('');
    const [buttonLink, setButtonLink] = useState('');
    const [orderNumber, setOrderNumber] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
        fetchSliders();
    }, []);

    const fetchSliders = async () => {
        setLoading(true);
        try {
            const res = await authFetch(apiUrl('/api/hero-sliders'));
            const data = await res.json();
            setSliders(data);
        } catch (e) {
            console.error('Failed to fetch sliders', e);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (slider?: Slider) => {
        if (slider) {
            setEditingSlider(slider);
            setTitle(slider.title);
            setSubtitle(slider.subtitle || '');
            setButtonText(slider.button_text || '');
            setButtonLink(slider.button_link || '');
            setOrderNumber(slider.order_number);
            setIsActive(slider.is_active);
        } else {
            setEditingSlider(null);
            setTitle('');
            setSubtitle('');
            setButtonText('');
            setButtonLink('');
            setOrderNumber(sliders.length);
            setIsActive(true);
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploadLoading(true);

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('subtitle', subtitle);
            formData.append('button_text', buttonText);
            formData.append('button_link', buttonLink);
            formData.append('order_number', orderNumber.toString());
            formData.append('is_active', isActive ? '1' : '0');
            if (imageFile) formData.append('image', imageFile);

            const url = editingSlider 
                ? apiUrl(`/api/hero-sliders/${editingSlider.id}`)
                : apiUrl('/api/hero-sliders');
            
            const method = editingSlider ? 'PUT' : 'POST';

            const res = await authFetch(url, {
                method,
                body: formData,
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchSliders();
            } else {
                const data = await res.json();
                alert(data.message || 'Gagal menyimpan slider');
            }
        } catch (e) {
            console.error('Error saving slider', e);
            alert('Terjadi kesalahan sistem');
        } finally {
            setUploadLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus slider ini?')) return;

        try {
            const res = await authFetch(apiUrl(`/api/hero-sliders/${id}`), { method: 'DELETE' });
            if (res.ok) fetchSliders();
        } catch (e) {
            console.error('Delete error', e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronLeft size={24} className="text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Setting Slider Hero</h1>
                    <p className="text-slate-500 text-sm">Kelola gambar dan teks di landing page</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="ml-auto flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all"
                >
                    <Plus size={20} />
                    Tambah Slider
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sliders.map(slider => (
                        <div key={slider.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm group">
                            <div className="relative aspect-[16/9] bg-slate-900">
                                <img 
                                    src={apiUrl(slider.image_url)} 
                                    className={`w-full h-full object-cover transition-opacity ${slider.is_active ? 'opacity-70' : 'opacity-30 grayscale'}`}
                                    alt={slider.title}
                                />
                                {!slider.is_active && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Nonaktif</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                                    <h3 className="font-bold text-lg leading-tight">{slider.title}</h3>
                                    <p className="text-sm opacity-80 line-clamp-2 mt-1">{slider.subtitle}</p>
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleOpenModal(slider)}
                                        className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-lg shadow-sm"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(slider.id)}
                                        className="p-2 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg shadow-sm"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">#{slider.order_number}</span>
                                    <span>Urutan</span>
                                </div>
                                {slider.button_text && (
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Button: {slider.button_text}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-bold text-lg text-slate-800">{editingSlider ? 'Edit Slider' : 'Tambah Slider Baru'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Judul (Main Title)</label>
                                    <input 
                                        type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Subjudul / Deskripsi</label>
                                    <textarea 
                                        rows={2} value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-rose-500 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Teks Tombol</label>
                                    <input 
                                        type="text" value={buttonText} onChange={(e) => setButtonText(e.target.value)}
                                        placeholder="Contoh: Selengkapnya"
                                        className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Link Tombol</label>
                                    <input 
                                        type="text" value={buttonLink} onChange={(e) => setButtonLink(e.target.value)}
                                        placeholder="Contoh: /pendaftaran"
                                        className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Urutan</label>
                                    <input 
                                        type="number" value={orderNumber} onChange={(e) => setOrderNumber(parseInt(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                                <div className="flex items-center h-full pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isActive ? 'translate-x-4' : ''}`} />
                                        </div>
                                        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="hidden" />
                                        <span className="text-sm font-medium text-slate-600">Aktif</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Gambar Background</label>
                                <div className="relative group">
                                    <input 
                                        type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`w-full py-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${imageFile ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}>
                                        <Upload className={imageFile ? 'text-rose-600' : 'text-slate-400'} size={24} />
                                        <p className="text-sm mt-1 font-medium">{imageFile ? imageFile.name : (editingSlider ? 'Ganti Gambar (Opsional)' : 'Pilih Gambar')}</p>
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" disabled={uploadLoading || (!editingSlider && !imageFile)}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-2xl font-bold shadow-lg shadow-rose-200 mt-2 flex items-center justify-center gap-2"
                            >
                                {uploadLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                                Simpan Slider
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
