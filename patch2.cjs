const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// 1. Change resizeCategoryAsset quality
code = code.replace(/canvas\.toDataURL\("image\/webp", 0\.9\)/g, 'canvas.toDataURL("image/webp", 0.7)');

// 2. Change the resize dimensions for category and banner to be slightly smaller
code = code.replace(/resizeCategoryAsset\(e\.target\.files\[0\], 600, 600\)/g, 'resizeCategoryAsset(e.target.files[0], 500, 500)');
code = code.replace(/resizeCategoryAsset\(e\.target\.files\[0\], 1600, 700\)/g, 'resizeCategoryAsset(e.target.files[0], 1200, 500)');

// 3. Inject upload function
const uploadFn = `
  const uploadImageToServer = async (base64Str: string, folder: string) => {
    if (!base64Str || !base64Str.startsWith('data:image')) return base64Str;
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Str, folder })
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.url;
    } catch (e) {
      console.error('Image upload failed:', e);
      return base64Str; // fallback to base64
    }
  };
`;

code = code.replace('const loadCategoriesFromApi = () => {', uploadFn + '\n  const loadCategoriesFromApi = () => {');

// 4. In the Add Category submit handler, upload before creating
// We need to replace:
/*
                              const payload = {
                                name: catFormName,
                                slug: catFormSlug || catFormName.toLowerCase().replace(/\\s+/g, '-'),
                                image: catFormImage,
                                iconImage: catFormImage,
                                banner: catFormBanner,
                                mainBanner: catFormBanner,
*/

const oldPayloadStr = `                              const payload = {
                                name: catFormName,
                                slug: catFormSlug || catFormName.toLowerCase().replace(/\\s+/g, '-'),
                                image: catFormImage,
                                iconImage: catFormImage,
                                banner: catFormBanner,
                                mainBanner: catFormBanner,`;

const newPayloadStr = `                              const finalImageUrl = await uploadImageToServer(catFormImage, 'categories');
                              const finalBannerUrl = await uploadImageToServer(catFormBanner, 'categories/banners');

                              const payload = {
                                name: catFormName,
                                slug: catFormSlug || catFormName.toLowerCase().replace(/\\s+/g, '-'),
                                image: finalImageUrl,
                                iconImage: finalImageUrl,
                                banner: finalBannerUrl,
                                mainBanner: finalBannerUrl,`;

code = code.replace(oldPayloadStr, newPayloadStr);

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("Patched Admin.tsx");
