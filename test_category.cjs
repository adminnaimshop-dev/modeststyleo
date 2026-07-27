const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

async function testUpsert() {
  const config = JSON.parse(fs.readFileSync("./local_supabase_config.json", "utf8"));
  const supabase = createClient(config.url, config.key, { auth: { persistSession: false } });

  const catId = "cat_" + Date.now();
  const catName = "Test Category " + Date.now();
  const cleanSlug = "test-category-" + Date.now();
  const nowStr = new Date().toISOString();

  const fullData = {
    id: catId,
    catName,
    cleanSlug,
    imgVal: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600",
    bannerVal: "",
    sectionBanner: "",
    description: "A test description",
    status: true,
    orderVal: 1,
    seoTitle: catName,
    seoDescription: catName,
    createdAt: nowStr,
    nowStr
  };

  const payload = {
    id: fullData.id,
    category_name: fullData.catName,
    slug: fullData.cleanSlug,
    image: fullData.imgVal,
    icon_image: fullData.imgVal,
    banner: fullData.bannerVal,
    section_banner: fullData.sectionBanner || "",
    description: fullData.description || "",
    status: fullData.status !== undefined ? !!fullData.status : true,
    display_order: fullData.orderVal,
    serial_number: fullData.orderVal,
    seo_title: fullData.seoTitle || fullData.catName,
    seo_description: fullData.seoDescription || fullData.description || fullData.catName,
    created_at: fullData.createdAt || fullData.nowStr,
    updated_at: fullData.nowStr,
    last_edited: fullData.nowStr,
    short_title: fullData.catName
  };

  console.log("Upserting payload:", payload);
  let currentPayload = { ...payload };

  for (let attempt = 0; attempt < 10; attempt++) {
    console.log(`Attempt ${attempt + 1}...`);
    const { data, error } = await supabase.from("categories").upsert(currentPayload).select();
    if (!error) {
      console.log("✅ SUCCESS! Inserted row:", data);
      await supabase.from("categories").delete().eq("id", catId);
      console.log("Cleaned up.");
      return;
    }

    console.error(`❌ Attempt ${attempt + 1} Error:`, error);
    const errMsg = error.message || "";

    const colMatch = errMsg.match(/column ['"]?([a-zA-Z0-9_]+)['"]? (?:of relation|in the schema cache|does not exist)/i) ||
                     errMsg.match(/Could not find the ['"]?([a-zA-Z0-9_]+)['"]? column/i) ||
                     errMsg.match(/['"]([a-zA-Z0-9_]+)['"] column/i) ||
                     errMsg.match(/['"]([a-zA-Z0-9_]+)['"]/i);

    if (colMatch && colMatch[1]) {
      const missingCol = colMatch[1];
      console.log(`Matched missing column: ${missingCol}`);
      if (currentPayload[missingCol] !== undefined) {
        delete currentPayload[missingCol];
        console.log(`Stripped ${missingCol}, retrying...`);
        continue;
      }
    }
    break;
  }
}

testUpsert();
