const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf8');

const uploadCode = `
  // Image Upload Endpoint
  app.post("/api/upload", async (req, res) => {
    try {
      const { image, folder = "categories" } = req.body;
      if (!image || !image.startsWith("data:image")) {
        return res.json({ url: image }); // Not a base64 string, return as is
      }

      const supabase = getBackendSupabaseClient();
      if (!supabase) {
        return res.status(500).json({ error: "Supabase not connected" });
      }

      // Ensure bucket exists
      await supabase.storage.createBucket('uploads', { public: true }).catch(() => {});

      const mimeTypeMatch = image.match(/data:(image\\/[^;]+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/webp';
      const ext = mimeType.split('/')[1] || 'webp';
      const fileName = \`\${folder}/\${Date.now()}-\${Math.random().toString(36).substring(7)}.\${ext}\`;
      
      const buffer = Buffer.from(image.split(',')[1], 'base64');
      
      const { data, error } = await supabase.storage.from('uploads').upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true
      });

      if (error) {
        console.error("Storage upload error:", error);
        return res.status(500).json({ error: error.message });
      }

      const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
      res.json({ url: publicUrlData.publicUrl });
    } catch (err: any) {
      console.error("Upload endpoint error:", err);
      res.status(500).json({ error: err.message });
    }
  });
`;

if (!code.includes('/api/upload')) {
  const newCode = code.replace('  app.post("/api/categories", async (req, res) => {', uploadCode + '\n  app.post("/api/categories", async (req, res) => {');
  fs.writeFileSync('server.ts', newCode);
  console.log("Patched server.ts successfully");
} else {
  console.log("Already patched");
}
