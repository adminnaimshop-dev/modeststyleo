const fs = require('fs');
let code = fs.readFileSync('src/components/BannerManager.tsx', 'utf8');

// Reduce quality
code = code.replace(/canvas\.toDataURL\("image\/webp", 0\.9\)/g, 'canvas.toDataURL("image/webp", 0.7)');

const uploadFn = `
  const uploadImageToServer = async (base64Str: string) => {
    if (!base64Str || !base64Str.startsWith('data:image')) return base64Str;
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Str, folder: 'banners' })
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.url;
    } catch (e) {
      console.error('Image upload failed:', e);
      return base64Str;
    }
  };
`;

code = code.replace('export default function BannerManager() {', uploadFn + '\nexport default function BannerManager() {');

// Find the submit handler
const oldSubmit = `    const bannerData: Partial<Banner> = {
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string,
      badge: formData.get('badge') as string,
      image: previewImage,
      bg_color: formData.get('bg_color') as string,
      type: formData.get('type') as string,
      category_slug: formData.get('category_slug') as string,
      status: true
    };`;

const newSubmit = `    const finalImageUrl = await uploadImageToServer(previewImage);
    const bannerData: Partial<Banner> = {
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string,
      badge: formData.get('badge') as string,
      image: finalImageUrl,
      bg_color: formData.get('bg_color') as string,
      type: formData.get('type') as string,
      category_slug: formData.get('category_slug') as string,
      status: true
    };`;

code = code.replace(oldSubmit, newSubmit);
fs.writeFileSync('src/components/BannerManager.tsx', code);
console.log("Patched BannerManager.tsx");
