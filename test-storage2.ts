import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function run() {
  const configPath = path.join(process.cwd(), "local_supabase_config.json");
  const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  
  const supabase = createClient(data.url, data.key);
  
  // Create bucket
  await supabase.storage.createBucket('uploads', { public: true }).catch(()=>null);
  
  // Upload file
  const base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const buffer = Buffer.from(base64.split(',')[1], 'base64');
  
  const { data: upData, error } = await supabase.storage.from('uploads').upload('test.png', buffer, {
    contentType: 'image/png',
    upsert: true
  });
  
  console.log("Upload:", upData, error);
  
  const { data: pubData } = supabase.storage.from('uploads').getPublicUrl('test.png');
  console.log("URL:", pubData.publicUrl);
}
run();
