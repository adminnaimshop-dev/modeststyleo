const fs = require('fs');
let code = fs.readFileSync('src/components/AdminProductDetailsEdit.tsx', 'utf8');

const uploadFn = `
  const uploadImageToServer = async (base64Str: string) => {
    if (!base64Str || !base64Str.startsWith('data:image')) return base64Str;
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Str, folder: 'products' })
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

const oldCompress = `  // Handle auto-compression image compression function inside the component
  const compressProductImage = async (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const options = {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 1400,
          useWebWorker: true,
          initialQuality: 0.82
        };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        // Fallback to original image if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    });
  };`;

const newCompress = `  // Handle auto-compression image compression function inside the component
${uploadFn}
  const compressProductImage = async (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const options = {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 1200, // Reduced slightly
          useWebWorker: true,
          initialQuality: 0.75
        };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          const url = await uploadImageToServer(base64);
          resolve(url);
        };
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        // Fallback to original image if compression fails
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          const url = await uploadImageToServer(base64);
          resolve(url);
        };
        reader.readAsDataURL(file);
      }
    });
  };`;

code = code.replace(oldCompress, newCompress);
fs.writeFileSync('src/components/AdminProductDetailsEdit.tsx', code);
console.log("Patched AdminProductDetailsEdit.tsx");
