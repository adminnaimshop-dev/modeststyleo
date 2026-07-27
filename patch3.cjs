const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const oldPayloadStr = `                              const payload = {
                                id: editingCategory?.id,
                                name: catFormName.trim(),
                                slug: catFormSlug || catFormName.trim().toLowerCase().replace(/\\s+/g, '-'),
                                image: catFormImage,
                                iconImage: catFormImage,
                                banner: catFormBanner,
                                mainBanner: catFormBanner,`;

const newPayloadStr = `                              const finalImageUrl = await uploadImageToServer(catFormImage, 'categories');
                              const finalBannerUrl = await uploadImageToServer(catFormBanner, 'categories/banners');

                              const payload = {
                                id: editingCategory?.id,
                                name: catFormName.trim(),
                                slug: catFormSlug || catFormName.trim().toLowerCase().replace(/\\s+/g, '-'),
                                image: finalImageUrl,
                                iconImage: finalImageUrl,
                                banner: finalBannerUrl,
                                mainBanner: finalBannerUrl,`;

code = code.replace(oldPayloadStr, newPayloadStr);
fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("Patched Admin.tsx properly");
