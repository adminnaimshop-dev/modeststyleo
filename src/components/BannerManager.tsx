import React, { useState, useEffect, useRef } from 'react';
import { Banner } from '../types';
import { Trash2, Edit2, CheckCircle2, XCircle, Upload, X } from 'lucide-react';

const resizeImage = (file: File, width: number, height: number): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imgRatio = img.width / img.height;
          const targetRatio = width / height;
          let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
          
          if (imgRatio > targetRatio) {
            sWidth = img.height * targetRatio;
            sx = (img.width - sWidth) / 2;
          } else if (imgRatio < targetRatio) {
            sHeight = img.width / targetRatio;
            sy = (img.height - sHeight) / 2;
          }
          
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);
          resolve(canvas.toDataURL("image/webp", 0.9));
        } else {
          resolve("");
        }
      };
      if (event.target?.result) img.src = event.target.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/banners')
      .then(res => res.json())
      .then(data => {
         if (Array.isArray(data)) {
           setBanners(data);
         }
      })
      .catch(err => console.error("Error fetching banners:", err));
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLoading(true);
      const resized = await resizeImage(e.target.files[0], 2560, 1440);
      setPreviewImage(resized);
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!previewImage && !editingBanner?.image) {
      alert("Please select a banner image");
      return;
    }
    
    setLoading(true);
    const formData = new FormData(form);
    
    const bannerData: any = {
      image: previewImage || editingBanner?.image,
      title: formData.get('title') as string || '',
      subtitle: formData.get('subtitle') as string || '',
      buttonText: formData.get('buttonText') as string || '',
      buttonLink: formData.get('buttonLink') as string || '',
      status: editingBanner ? editingBanner.status : true,
      type: 'main'
    };

    if (editingBanner) {
      await fetch('/api/banners/' + editingBanner.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerData)
      });
      // Refresh banners
      fetch('/api/banners').then(res => res.json()).then(setBanners);
    } else {
      bannerData.serial = banners.length;
      await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([bannerData])
      });
      fetch('/api/banners').then(res => res.json()).then(setBanners);
    }
    
    setEditingBanner(null);
    setPreviewImage('');
    form.reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLoading(false);
  };

  const toggleStatus = async (banner: Banner) => {
    await fetch('/api/banners/' + banner.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: !banner.status })
    });
    fetch('/api/banners').then(res => res.json()).then(setBanners);
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/banners/' + id, { method: 'DELETE' });
    fetch('/api/banners').then(res => res.json()).then(setBanners);
  };
  
  const cancelEdit = () => {
    setEditingBanner(null);
    setPreviewImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-black mb-6">Banner Manager</h2>
      
      <form onSubmit={handleSave} className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-2xl">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-4 font-black">
          Recommended Size: 2560 × 1440 px (YouTube Banner Size)
        </p>
        
        <div className="flex flex-col gap-4">
          <div className="relative group rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 hover:border-[#ff2f7d] transition-colors w-full h-48 md:h-64 flex flex-col items-center justify-center cursor-pointer">
            {(previewImage || editingBanner?.image) ? (
              <>
                <img 
                  src={previewImage || editingBanner?.image} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white font-bold text-sm flex items-center gap-2">
                    <Upload size={18} /> Replace Image
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center">
                <Upload size={32} className="text-slate-300 mx-auto mb-2" />
                <span className="text-sm font-bold text-slate-400">Click to Upload Banner</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              ref={fileInputRef}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Main Title (Optional)</label>
              <input type="text" name="title" defaultValue={editingBanner?.title} placeholder="e.g. Winter Collection" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#ff2f7d]" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sub Title (Optional)</label>
              <input type="text" name="subtitle" defaultValue={editingBanner?.subtitle} placeholder="e.g. Up to 50% Off" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#ff2f7d]" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Button Text (Optional)</label>
              <input type="text" name="buttonText" defaultValue={editingBanner?.buttonText} placeholder="e.g. Shop Now" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#ff2f7d]" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Button Link (Optional)</label>
              <input type="text" name="buttonLink" defaultValue={editingBanner?.buttonLink} placeholder="e.g. /category/winter" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#ff2f7d]" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 py-3 bg-[#ff2f7d] hover:bg-[#e0266d] text-white rounded-xl text-sm font-black transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (editingBanner ? 'Update Banner' : 'Save Banner')}
            </button>
            
            {(previewImage || editingBanner) && (
              <button 
                type="button" 
                onClick={cancelEdit} 
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-black transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="space-y-3 w-full">
        {banners.map(banner => (
          <div key={banner.id} className="flex items-center gap-3 sm:gap-4 p-3 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all">
            <img src={banner.image} alt="Banner" className="w-24 sm:w-32 h-14 sm:h-16 object-cover rounded-lg border border-slate-100 shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{banner.title || 'Untitled Banner'}</h4>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">Status: {banner.status ? 'Active' : 'Inactive'}</span>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button 
                onClick={() => toggleStatus(banner)}
                className="p-1.5 sm:p-2 hover:bg-slate-50 rounded-lg transition-colors"
                title={banner.status ? 'Deactivate' : 'Activate'}
              >
                {banner.status ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-slate-300" />}
              </button>
              
              <button 
                onClick={() => {
                  setEditingBanner(banner);
                  setPreviewImage('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-1.5 sm:p-2 hover:bg-slate-50 rounded-lg transition-colors"
                title="Edit Banner"
              >
                <Edit2 size={16} className="text-slate-600" />
              </button>
              
              <button 
                onClick={() => {
                  if(window.confirm('Are you sure you want to delete this banner?')) {
                    handleDelete(banner.id);
                  }
                }}
                className="p-1.5 sm:p-2 hover:bg-rose-50 rounded-lg transition-colors group"
                title="Delete Banner"
              >
                <Trash2 size={16} className="text-slate-400 group-hover:text-rose-500" />
              </button>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="text-center py-10 text-slate-400 font-bold text-sm">
            No banners added yet
          </div>
        )}
      </div>
    </div>
  );
}
