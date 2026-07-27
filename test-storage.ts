import { createClient } from "@supabase/supabase-js";
import { loadSupabaseConfig } from "./src/lib/supabase";

async function run() {
  const config = loadSupabaseConfig();
  console.log("URL:", config.url);
  const supabase = createClient(config.url, config.key);
  
  // check buckets
  const { data, error } = await supabase.storage.listBuckets();
  console.log("Buckets:", data, "Error:", error);
  
  // try create bucket
  const { data: cData, error: cErr } = await supabase.storage.createBucket('uploads', { public: true });
  console.log("Create Bucket:", cData, "Error:", cErr);
}
run();
