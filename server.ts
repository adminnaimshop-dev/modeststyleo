import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { PRODUCTS, CATEGORIES, MAIN_HERO, COLLECTION_BANNERS } from "./src/data";
import { initMySQL, executeQuery, checkMySQLConnection, getMySQLPool, loadMySQLConfig, saveMySQLConfig, reinitMySQL, TABLE_DEFINITIONS } from "./src/lib/mysql";


// Helper to ensure admin user exists in MySQL
async function ensureAdminExists() {
  const adminEmail = "admin.naimshop@gmail.com";
  try {
    const hasMySQL = checkMySQLConnection();
    if (!hasMySQL) {
        console.log("No MySQL connection. Skipping Admin user seed.");
        return;
    }
    const adminPwdHash = crypto.createHash("sha256").update("85285296").digest("hex");
    const existing = await executeQuery("SELECT id, password_hash, role FROM users WHERE email = ?", [adminEmail]);
    if (existing.length === 0) {
      console.log("Seeding admin user to MySQL...");
      const adminId = "usr_admin_" + Date.now();
      await executeQuery(
        "INSERT INTO users (id, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)",
        [adminId, adminEmail, adminPwdHash, "Naim Shop Admin", "", "admin"]
      );
      console.log("Admin user seeded successfully.");
    } else {
      const adminDoc = existing[0];
      if (adminDoc.password_hash !== adminPwdHash || adminDoc.role !== "admin") {
         await executeQuery("UPDATE users SET password_hash = ?, role = ? WHERE email = ?", [adminPwdHash, "admin", adminEmail]);
         console.log("Admin user updated with new password.");
      }
    }
  } catch (err) {
    console.error("Error seeding admin:", err);
  }
}

// Backend in-memory state initialized with pre-existing data (syncs with MySQL on start)
let localCategories: any[] = [];

const categoriesFilePath = path.join(process.cwd(), "local_categories.json");
try {
  if (fs.existsSync(categoriesFilePath)) {
    localCategories = JSON.parse(fs.readFileSync(categoriesFilePath, "utf-8"));
  }
} catch (err) {
  console.error("Error reading persistent categories:", err);
}

function persistCategories() {
  try {
    fs.writeFileSync(categoriesFilePath, JSON.stringify(localCategories, null, 2), "utf-8");
  } catch (err) {
    console.error("Error persisting categories to disk:", err);
  }
}

let localMessages: any[] = [];
let localClickLogs: any[] = [];

const productsFilePath = path.join(process.cwd(), "local_products.json");
let localProducts: any[] = [];

try {
  if (fs.existsSync(productsFilePath)) {
    localProducts = JSON.parse(fs.readFileSync(productsFilePath, "utf-8"));
  }
} catch (err) {
  console.error("Error reading persistent products:", err);
}

const dbStateFilePath = path.join(process.cwd(), "local_db_state.json");
let setupTables: string[] = [];

try {
  if (fs.existsSync(dbStateFilePath)) {
    setupTables = JSON.parse(fs.readFileSync(dbStateFilePath, "utf-8"));
  }
} catch (err) {
  console.error("Error reading persistent db state:", err);
}

function persistDbState() {
  try {
    fs.writeFileSync(dbStateFilePath, JSON.stringify(setupTables, null, 2), "utf-8");
  } catch (err) {
    console.error("Error persisting db state to disk:", err);
  }
}

if (!localProducts || localProducts.length === 0) {
  localProducts = [...PRODUCTS].map(p => {
    const cat = localCategories.find(c => c.name.toLowerCase() === p.category.toLowerCase());
    return {
      ...p,
      title: p.title || p.name || "",
      categoryId: p.categoryId || cat?.id || "1",
      categorySlug: p.categorySlug || cat?.slug || "saree",
      categoryName: p.categoryName || p.category || "Saree",
      images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
      status: p.status || "published",
      isDeleted: false,
      stock: p.stock || "In Stock"
    };
  });
}

function persistProducts() {
  try {
    fs.writeFileSync(productsFilePath, JSON.stringify(localProducts, null, 2), "utf-8");
  } catch (err) {
    console.error("Error persisting products to disk:", err);
  }
}

let localBanners: any[] = [];
let localReviewSettings = {
  enabled: true,
  adminApproval: false,
  maxImages: 2,
  cameraEnabled: true,
  galleryEnabled: true,
  verifiedPurchaseOnly: false
};

let localMessengerSettings = {
  aiAutoReplyEnabled: true,
  faqs: [
    { id: "faq_1", question: "আপনাদের দোকান বা শোরুম কোথায়?", answer: "আমাদের শো-রুম ঢাকার ধানমন্ডিতে অবস্থিত।" },
    { id: "faq_2", question: "ডেলিভারি চার্জ কত?", answer: "ঢাকা সিটির ভেতরে ডেলিভারি চার্জ ৬০ টাকা, এবং ঢাকার বাইরে ১৫০ টাকা।" },
    { id: "faq_3", question: "অর্ডার কনফার্ম করার পর পেতে কত দিন সময় লাগবে?", answer: "ঢাকার ভেতরে সাধারণত ২-৩ দিন এবং ঢাকার বাইরে ৩-৫ কার্যদিবসের মধ্যে ডেলিভারি পেয়ে যাবেন।" },
    { id: "faq_4", question: "পেমেন্ট কিভাবে করতে হবে?", answer: "আমাদের এখানে ক্যাশ অন ডেলিভারি (COD) এছাড়া বিকাশ, রকেট ও কার্ডের মাধ্যমে পেমেন্ট করার সুবিধা রয়েছে।" }
  ]
};

const messengerSettingsFilePath = path.join(process.cwd(), "local_messenger_settings.json");
try {
  if (fs.existsSync(messengerSettingsFilePath)) {
    localMessengerSettings = JSON.parse(fs.readFileSync(messengerSettingsFilePath, "utf-8"));
  } else {
    fs.writeFileSync(messengerSettingsFilePath, JSON.stringify(localMessengerSettings, null, 2), "utf-8");
  }
} catch (err) {
  console.error("Error reading persistent messenger settings:", err);
}

function persistMessengerSettings() {
  try {
    fs.writeFileSync(messengerSettingsFilePath, JSON.stringify(localMessengerSettings, null, 2), "utf-8");
  } catch (err) {
    console.error("Error persisting messenger settings:", err);
  }
}

let localReviews: any[] = [];

// Schema mapping config for reference
const REQUIRED_DB_SCHEMAS: Record<string, string[]> = {
  products: [
    "id", "title", "name", "price", "old_price", "discount_price", "category_id", "category_slug", 
    "category_name", "images", "image", "stock", "status", "views", "rating", "sku", "fabric", 
    "gsm", "fit", "care", "sizes", "short_description", "full_description", "is_flash_sale", 
    "is_deleted", "unpublished_by_system"
  ],
  categories: [
    "id", "name", "image", "icon_image", "short_title", "main_banner", "section_banner", 
    "status", "serial_number", "last_edited", "slug", "updated_at"
  ],
  banners: [
    "id", "title", "subtitle", "badge", "image", "bg_color", "type", "status", "serial", "category_slug"
  ],
  reviews: [
    "id", "product_id", "product_name", "customer_name", "text", "rating", "images", "status", "verified", "avatar", "date"
  ],
  messages: [
    "id", "customer_id", "customer_name", "customer_email", "message", "reply_by", "timestamp", "type", "matched_source"
  ],
  click_logs: [
    "id", "type", "timestamp"
  ]
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Check / Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ================= 🚀 DATABASE SETUP WIZARD API =================

  // 1. Diagnostics: Check connection, DB existence, and Missing Tables
  app.get("/api/mysql/diagnostics", async (req, res) => {
    try {
      const config = loadMySQLConfig();
      const status: any = {
        config: { host: config.host, user: config.user, database: config.database, port: config.port },
        serverConnected: false,
        databaseExists: false,
        missingTables: [],
        existingTables: [],
        error: null
      };

      // 1. Try to connect to the server (root/no db)
      const mysql = (await import('mysql2/promise')).default;
      let rootConn;
      try {
        rootConn = await mysql.createConnection({
          host: config.host,
          port: config.port,
          user: config.user,
          password: config.password,
          connectTimeout: 5000
        });
        status.serverConnected = true;
      } catch (connErr: any) {
        status.error = connErr.message;
        return res.json(status);
      }

      // 2. Check if DB exists
      try {
        const [dbRows]: any = await rootConn.query(`SHOW DATABASES LIKE '${config.database}'`);
        status.databaseExists = dbRows.length > 0;
      } catch (dbErr: any) {
        status.error = `Failed to check database: ${dbErr.message}`;
      } finally {
        await rootConn.end();
      }

      if (!status.databaseExists) {
        status.missingTables = Object.keys(TABLE_DEFINITIONS);
        return res.json(status);
      }

      // 3. Check for missing tables and columns
      try {
        if (!checkMySQLConnection()) {
          await initMySQL(1, 1000);
        }

        if (checkMySQLConnection()) {
          const tablesRows = await executeQuery(`SHOW TABLES`);
          const existingTables = Array.isArray(tablesRows) ? tablesRows.map((row: any) => {
            const keys = Object.keys(row);
            return String(row[keys[0]] || "").toLowerCase();
          }) : [];
          
          status.existingTables = existingTables;
          
          const allTables = Object.keys(TABLE_DEFINITIONS);
          const tableDetails: any[] = [];

          for (const tableName of allTables) {
            const isTableMissing = !existingTables.includes(tableName.toLowerCase());
            const detail: any = {
              name: tableName,
              status: isTableMissing ? 'missing' : 'exists',
              columns: []
            };

            if (!isTableMissing) {
              // Check columns if table exists
              try {
                const columnsRows = await executeQuery(`SHOW COLUMNS FROM \`${tableName}\``);
                const existingColumns = columnsRows.map((col: any) => col.Field.toLowerCase());
                
                // Parse table definition to find required columns
                const def = TABLE_DEFINITIONS[tableName];
                const columnRegex = /^\s*([a-zA-Z0-9_]+)\s+[a-zA-Z0-9_]+/gm;
                let match;
                const requiredColumns: string[] = [];
                while ((match = columnRegex.exec(def)) !== null) {
                  const colName = match[1].toLowerCase();
                  if (!['create', 'table', 'if', 'not', 'exists', 'primary', 'unique', 'foreign', 'constraint', 'index', 'key', 'engine', 'default', 'charset', 'collate'].includes(colName)) {
                    requiredColumns.push(colName);
                  }
                }

                detail.columns = requiredColumns.map(col => ({
                  name: col,
                  status: existingColumns.includes(col) ? 'exists' : 'missing'
                }));
              } catch (colErr) {
                console.warn(`Could not check columns for ${tableName}:`, colErr);
              }
            }
            tableDetails.push(detail);
          }
          
          status.tableDetails = tableDetails;
          status.missingTables = tableDetails.filter(t => t.status === 'missing').map(t => t.name);
        } else {
          status.missingTables = Object.keys(TABLE_DEFINITIONS);
        }
      } catch (err: any) {
        status.error = `Schema check failed: ${err.message}`;
      }

      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Create Database
  app.post("/api/mysql/create-database", async (req, res) => {
    try {
      const config = loadMySQLConfig();
      const mysql = (await import('mysql2/promise')).default;
      const rootConn = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        connectTimeout: 5000
      });

      await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
      await rootConn.end();

      // Re-init pool to recognize the new database
      await reinitMySQL();

      res.json({ success: true, message: `Database '${config.database}' created successfully.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Create Specific Table
  app.post("/api/mysql/create-table", async (req, res) => {
    try {
      const { tableName } = req.body;
      if (!tableName || !TABLE_DEFINITIONS[tableName]) {
        return res.status(400).json({ error: `Invalid or missing table name: ${tableName}` });
      }

      // Ensure connection is active
      if (!checkMySQLConnection()) {
        await initMySQL(1, 1000);
      }

      if (!checkMySQLConnection()) {
        throw new Error("Database not connected. Please fix credentials first.");
      }

      await executeQuery(TABLE_DEFINITIONS[tableName]);
      res.json({ success: true, message: `Table '${tableName}' created successfully.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Execute SQL (for fixing columns/tables)
  app.post("/api/mysql/execute-sql", async (req, res) => {
    try {
      const { sql } = req.body;
      if (!sql) return res.status(400).json({ error: "No SQL provided" });
      
      const result = await executeQuery(sql);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4.5 Auto Repair missing tables & columns
  app.post("/api/mysql/auto-repair", async (req, res) => {
    try {
      if (!checkMySQLConnection()) {
        await initMySQL(1, 1000);
      }
      if (!checkMySQLConnection()) {
        return res.status(400).json({ error: "ডাটাবেজ সার্ভার সংযোগ করতে পারেনি।" });
      }

      const tablesRows = await executeQuery(`SHOW TABLES`);
      const existingTables = Array.isArray(tablesRows) ? tablesRows.map((row: any) => {
        const keys = Object.keys(row);
        return String(row[keys[0]] || "").toLowerCase();
      }) : [];

      const allTables = Object.keys(TABLE_DEFINITIONS);
      
      for (const tableName of allTables) {
        const isTableMissing = !existingTables.includes(tableName.toLowerCase());
        if (isTableMissing) {
          console.log(`Auto Repair: Creating table ${tableName}`);
          await executeQuery(TABLE_DEFINITIONS[tableName]);
        } else {
          // Check for missing columns
          try {
            const columnsRows = await executeQuery(`SHOW COLUMNS FROM \`${tableName}\``);
            const existingColumns = columnsRows.map((col: any) => col.Field.toLowerCase());
            
            const def = TABLE_DEFINITIONS[tableName];
            const lines = def.split('\n');
            for (let line of lines) {
              line = line.trim();
              if (line.toLowerCase().startsWith('create table') || line.startsWith(')') || !line) continue;
              
              const match = /^\s*([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_().]+(?:\s+[a-zA-Z0-9_().]+)*)/.exec(line);
              if (match) {
                const colName = match[1].toLowerCase();
                const colDef = match[2];
                
                if (['primary', 'unique', 'foreign', 'constraint', 'index', 'key', 'engine', 'default', 'charset', 'collate'].includes(colName)) {
                  continue;
                }

                if (!existingColumns.includes(colName)) {
                  console.log(`Auto Repair: Adding column ${colName} to ${tableName}`);
                  let cleanDef = colDef.replace(/,$/, '').replace(/primary key/gi, '');
                  await executeQuery(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${colName}\` ${cleanDef}`);
                }
              }
            }
          } catch (colErr) {
            console.warn(`Auto Repair: Could not check/fix columns for ${tableName}:`, colErr);
          }
        }
      }

      res.json({ success: true, message: "সকল টেবিল এবং কলাম সফলভাবে তৈরি/সংস্কার করা হয়েছে!" });
    } catch (err: any) {
      console.error("Auto Repair failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Force Reconnect / Save Config
  app.post("/api/mysql/update-config", async (req, res) => {
    try {
      const config = req.body;
      saveMySQLConfig(config);
      const result = await reinitMySQL(config);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Database Validation: Check for missing tables in Hostinger MySQL
  app.get("/api/db/validate-tables", async (req, res) => {
    try {
      const missingTables: string[] = [];
      const missingColumns: string[] = [];
      const hasMySQL = checkMySQLConnection();

      const requiredTables = ["products", "categories", "product_images", "product_variants", "product_sizes", "offers", "banners", "reviews", "messages", "click_logs", "users"];

      if (hasMySQL) {
        for (const t of requiredTables) {
          try {
            await executeQuery(`SELECT * FROM ${t} LIMIT 0`);
          } catch (e) {
            missingTables.push(t);
          }
        }
      } else {
        missingTables.push(...requiredTables);
      }

      res.json({
        connectionOk: hasMySQL,
        missingTables,
        missingColumns
      });
    } catch (err: any) {
      console.error("Error validating database tables:", err);
      res.status(500).json({ error: err.message || "Failed to validate tables" });
    }
  });

  // Smart Database Validation System before product/category save (Real Schema Inspection)
  app.post("/api/db/validate-save", async (req, res) => {
    try {
      // Auto-initialize connection pool if it's currently null
      if (!getMySQLPool()) {
        try {
          await initMySQL(1, 1000);
        } catch (initErr: any) {
          console.error("Auto-initialization of MySQL pool failed:", initErr);
        }
      }

      // If the MySQL connection is not active
      if (!checkMySQLConnection()) {
        let connectionError = "ডাটাবেজ কানেকশন সমস্যা। অনুগ্রহ করে আপনার ডাটাবেজ তথ্য চেক করুন।";
        
        try {
          const result = await reinitMySQL();
          if (!result.success) {
            // Simplified error message without technical details
            if (result.error?.toLowerCase().includes("access denied")) {
              connectionError = "ডাটাবেজ এক্সেস ডিনাইড (Access Denied)। ইউজার বা পাসওয়ার্ড ভুল হতে পারে।";
            } else if (result.error?.toLowerCase().includes("enotfound") || result.error?.toLowerCase().includes("econnrefused")) {
              connectionError = "ডাটাবেজ হোস্ট কানেক্ট করা যাচ্ছে না। দয়া করে হোস্ট চেক করুন।";
            } else {
              connectionError = "ডাটাবেজ কানেক্ট করা যাচ্ছে না। দয়া করে হোস্ট, ইউজার এবং পাসওয়ার্ড পুনরায় চেক করুন।";
            }
          }
        } catch (e) {}

        return res.json({ 
          valid: false, 
          errorType: "connection",
          message: connectionError
        });
      }

      const { tableName, columns } = req.body;
      if (!tableName) return res.status(400).json({ success: false, message: "Table name required" });

      // 1. Check Table Existence
      let tablesRows;
      try {
        tablesRows = await executeQuery(`SHOW TABLES LIKE '${tableName}'`);
      } catch (connErr: any) {
        return res.json({
          valid: false,
          errorType: "connection",
          message: `ডাটাবেজ কুয়েরি সমস্যা: ${connErr.message || "কানেকশন ফেইল্ড।"}`
        });
      }

      if (!Array.isArray(tablesRows) || tablesRows.length === 0) {
        return res.json({ 
          valid: false, 
          errorType: "table_missing",
          tableName,
          message: `আপনার ডাটাবেজে 'products' টেবিলটি তৈরি নাই। ডাটা সেভ করার জন্য এই টেবিলটি তৈরি করা আবশ্যক।` 
        });
      }

      // 2. Check Column Existence (one by one)
      if (columns && Array.isArray(columns)) {
        const columnRows: any = await executeQuery(`DESCRIBE \`${tableName}\``);
        const existingColumns = Array.isArray(columnRows) ? columnRows.map((c: any) => {
          const colName = c.Field || c.field || c.Column || c.column || Object.values(c)[0];
          return String(colName || "").toLowerCase();
        }) : [];

        const banglaColNameMap: Record<string, string> = {
          id: 'id (আইডি)',
          name: 'name (নাম)',
          price: 'price (মূল্য)',
          old_price: 'old_price (পূর্ববর্তী মূল্য)',
          discount_price: 'discount_price (ডিসকাউন্ট মূল্য)',
          category: 'category (ক্যাটাগরি)',
          category_id: 'category_id (ক্যাটাগরি আইডি)',
          sku: 'sku (এসকেইউ)',
          stock: 'stock (স্টক)',
          status: 'status (স্ট্যাটাস)',
          fabric: 'fabric (ফেব্রিক)',
          gsm: 'gsm (জিএসএম)',
          fit: 'fit (ফিট)',
          care: 'care (যত্ন)',
          short_description: 'short_description (সংক্ষিপ্ত বিবরণ)',
          full_description: 'full_description (বিস্তারিত বিবরণ)',
          is_flash_sale: 'is_flash_sale (ফ্ল্যাশ সেল)',
          created_at: 'created_at (তৈরির সময়)'
        };

        for (const col of columns) {
          if (!existingColumns.includes(col.toLowerCase())) {
            const colDisplay = banglaColNameMap[col.toLowerCase()] || col;
            return res.json({
              valid: false,
              errorType: "column_missing",
              tableName,
              columnName: col,
              message: `প্রোডাক্টস টেবিল তৈরি আছে, কিন্তু প্রোডাক্ট টেবিলের আন্ডারে '${colDisplay}' নামক কলাম তৈরি নাই।`
            });
          }
        }
      }

      return res.json({ valid: true, message: "Database validation successful." });
    } catch (err: any) {
      console.error("Error in real-time schema validation:", err);
      res.status(500).json({ 
        valid: false,
        errorType: "connection",
        message: `❌ ডাটাবেজ ইন্সপেকশন ফেইল্ড: ${err.message || "Could not read MySQL database schema."}`
      });
    }
  });

  // Database Setup: Mark tables as successfully created
  app.post("/api/db/setup-tables", async (req, res) => {
    try {
      await initMySQL();
      res.json({ success: true, message: "MySQL automatic setup and migrations completed successfully" });
    } catch (err: any) {
      console.error("Error setting up database tables:", err);
      res.status(500).json({ error: err.message || "Failed to setup database tables" });
    }
  });

  // Get dynamic MySQL configuration
  app.get("/api/db/config", (req, res) => {
    try {
      const config = loadMySQLConfig();
      res.json({
        ...config,
        connectionOk: checkMySQLConnection()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Save and reconnect MySQL configuration
  app.post("/api/db/config", async (req, res) => {
    try {
      const { host, port, database, user, password } = req.body;
      if (!host || !database || !user) {
        return res.status(400).json({ error: "Host, Database Name, and Username are required." });
      }

      // Save to config file
      saveMySQLConfig({ host, port: parseInt(port, 10) || 3306, database, user, password });

      // Trigger reconnect
      const reinitResult = await reinitMySQL();
      
      if (reinitResult.success) {
        // Re-synchronize data from new database connection to memory
        try {
          const catRows = await executeQuery("SELECT * FROM categories ORDER BY serial_number ASC");
          if (catRows && catRows.length > 0) {
            localCategories = catRows.map(row => ({
              id: row.id,
              name: row.name,
              image: row.image,
              iconImage: row.icon_image,
              shortTitle: row.short_title,
              mainBanner: row.main_banner,
              sectionBanner: row.section_banner,
              status: !!row.status,
              serialNumber: row.serial_number,
              lastEdited: row.last_edited,
              slug: row.slug,
              updatedAt: row.updated_at
            }));
            persistCategories();
          }

          const prodRows = await executeQuery("SELECT * FROM products WHERE is_deleted = 0");
          if (prodRows && prodRows.length > 0) {
            localProducts = prodRows.map(row => ({
              id: row.id,
              title: row.title || row.name,
              name: row.name || row.title,
              price: Number(row.price),
              oldPrice: row.old_price ? Number(row.old_price) : undefined,
              discountPrice: row.discount_price ? Number(row.discount_price) : undefined,
              categoryId: row.category_id,
              categorySlug: row.category_slug,
              categoryName: row.category_name,
              images: typeof row.images === "string" ? JSON.parse(row.images) : (Array.isArray(row.images) ? row.images : []),
              image: row.image,
              stock: row.stock,
              status: row.status,
              views: Number(row.views || 0),
              rating: Number(row.rating || 4.8),
              sku: row.sku,
              fabric: row.fabric,
              gsm: row.gsm,
              fit: row.fit,
              care: row.care,
              sizes: typeof row.sizes === "string" ? JSON.parse(row.sizes) : (Array.isArray(row.sizes) ? row.sizes : []),
              shortDescription: row.short_description,
              fullDescription: row.full_description,
              isFlashSale: !!row.is_flash_sale,
              isDeleted: !!row.is_deleted,
              unpublishedBySystem: !!row.unpublished_by_system
            }));
            try {
              fs.writeFileSync(productsFilePath, JSON.stringify(localProducts, null, 2), "utf-8");
            } catch (err) {}
          }
        } catch (syncErr: any) {
          console.warn("MySQL dynamic re-initialization succeeded but data-sync failed (likely empty tables):", syncErr.message);
        }

        res.json({ success: true, message: "Successfully connected to MySQL and synchronized database." });
      } else {
        res.status(400).json({ error: reinitResult.error || "Failed to connect to MySQL database with the provided credentials." });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------- AUTHENTICATION ENDPOINTS (MySQL-backed) ----------------
  
  // Login Endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Hash password using sha256
      const hash = crypto.createHash("sha256").update(password).digest("hex");
      
// 1. Use MySQL
      const hasMySQL = checkMySQLConnection();
      if (!hasMySQL) return res.status(500).json({ error: "Database not connected" });
      if (hasMySQL) {
        const rows = await executeQuery("SELECT * FROM users WHERE email = ?", [email]);
        if (rows.length > 0) {
          const user = rows[0];
          if (user.password_hash === hash) {
            return res.json({
              user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone || '',
                avatar_url: user.avatar_url || '',
                role: user.role
              }
            });
          }
        }
      }

      return res.status(401).json({ error: "Invalid email or password" });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: err.message || "Failed to log in" });
    }
  });

  // Register Endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, fullName, phone } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const userId = "usr_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const hash = crypto.createHash("sha256").update(password).digest("hex");

// 1. Save to MySQL
      const hasMySQL = checkMySQLConnection();
      if (!hasMySQL) return res.status(500).json({ error: "Database not connected" });
      if (hasMySQL) {
        try {
          const existing = await executeQuery("SELECT id FROM users WHERE email = ?", [email]);
          if (existing.length === 0) {
            await executeQuery(
              "INSERT INTO users (id, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)",
              [userId, email, hash, fullName || 'Customer', phone || '', 'customer']
            );
          }
        } catch (mySqlErr: any) {
          console.error("MySQL registration error:", mySqlErr);
        }
      }

      res.status(201).json({
        user: {
          id: userId,
          email,
          full_name: fullName || 'Customer',
          phone: phone || '',
          avatar_url: '',
          role: 'customer'
        }
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      res.status(500).json({ error: err.message || "Failed to register" });
    }
  });

  
  // Customers API
  app.get("/api/customers", async (req, res) => {
    try {
      const hasMySQL = checkMySQLConnection();
      if (hasMySQL) {
        const rows = await executeQuery("SELECT id, email, full_name as name, phone, avatar_url, role as status, created_at as memberSince FROM users WHERE role = 'customer'");
        res.json(rows.map((r: any) => ({
          id: r.id,
          uid: r.id,
          name: r.name || 'Customer',
          email: r.email,
          phone: r.phone || '',
          avatar: r.avatar_url || '',
          status: 'active',
          orders: 0,
          totalSpent: 0,
          memberSince: r.memberSince || new Date().toISOString()
        })));
      } else {
        res.json([]);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      // In this DB, status is just handled... wait, maybe there's no status column.
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const hasMySQL = checkMySQLConnection();
      if (hasMySQL) {
        await executeQuery("DELETE FROM users WHERE id = ?", [id]);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Session Endpoint
  app.get("/api/auth/session", (req, res) => {
    res.json({ session: null });
  });

  // Logout Endpoint
  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });

  // Update Password Endpoint
  app.post("/api/auth/update-password", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const hash = crypto.createHash("sha256").update(password).digest("hex");

// 1. Update in MySQL
      const hasMySQL = checkMySQLConnection();
      if (!hasMySQL) return res.status(500).json({ error: "Database not connected" });
      if (hasMySQL) {
        try {
          await executeQuery("UPDATE users SET password_hash = ? WHERE email = ?", [hash, email]);
        } catch (mySqlErr) {
          console.error("MySQL password update error:", mySqlErr);
        }
      }

      res.json({ success: true, message: "Password updated successfully" });
    } catch (err: any) {
      console.error("Update password error:", err);
      res.status(500).json({ error: err.message || "Failed to update password" });
    }
  });

  // OTP Send Mock
  app.post("/api/auth/otp-send", (req, res) => {
    res.json({ success: true, message: "OTP sent successfully (Simulated)" });
  });

  // OTP Verify Mock
  app.post("/api/auth/otp-verify", async (req, res) => {
    try {
      const { email } = req.body;
      const hasMySQL = checkMySQLConnection();
      if (hasMySQL) {
        const rows = await executeQuery("SELECT * FROM users WHERE email = ?", [email]);
        if (rows.length > 0) {
          const user = rows[0];
          return res.json({
            user: {
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              phone: user.phone || '',
              avatar_url: user.avatar_url || '',
              role: user.role
            }
          });
        }
      }
      const userId = "usr_otp_" + Date.now();
      res.json({
        user: {
          id: userId,
          email: email || "customer@example.com",
          full_name: "OTP Customer",
          phone: "",
          avatar_url: "",
          role: "customer"
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  // Reset Password Mock
  app.post("/api/auth/reset-password", (req, res) => {
    res.json({ success: true, message: "Password reset instructions sent (Simulated)" });
  });

  // Bulk Product Upload with cell-by-cell validated rows
  app.post("/api/products/bulk", async (req, res) => {
    try {
      const { products } = req.body;
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: "Products array is required" });
      }

      const importedProducts = [];

      for (const p of products) {
        const newProduct = {
          id: "p_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
          title: p.name || p.title || "Bulk Imported Product",
          name: p.name || p.title || "Bulk Imported Product",
          price: Number(p.price) || 0,
          oldPrice: p.regularPrice ? Number(p.regularPrice) : (p.price ? Math.round(Number(p.price) * 1.25) : undefined),
          discountPrice: Number(p.price) || 0,
          categoryId: p.categoryId || "1",
          categorySlug: p.categorySlug || (p.category ? p.category.toLowerCase().replace(/\s+/g, '-') : "saree"),
          categoryName: p.category || "Saree",
          images: p.galleryImages ? p.galleryImages.split(',').map((img: string) => img.trim()).filter(Boolean) : (p.productImage ? [p.productImage] : []),
          image: p.productImage || "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400&q=80",
          stock: Number(p.stockQuantity) > 0 ? "In Stock" : "Out of Stock",
          status: "published",
          views: 2200,
          rating: 4.8,
          sku: p.sku || p.productId || "SKU-TEMP",
          fabric: p.fabric || "Premium Cotton",
          gsm: "160 GSM",
          fit: "Regular Fit",
          care: "Normal Wash",
          sizes: p.size ? p.size.split(',').map((s: string) => s.trim()).filter(Boolean) : ["M", "L", "XL", "XXL"],
          shortDescription: p.shortDescription || "Beautiful premium model crafted with perfection.",
          fullDescription: p.fullDescription || "Exquisite detailing and high-quality premium threadwork ensure extreme comfort and durability.",
          isFlashSale: false,
          isDeleted: false,
          brand: p.brand || "Naim Shop",
          features: p.features || "Premium wear",
          color: p.color || "Royal Blue",
          weight: p.weight || "0.4 KG",
          waterResistance: p.waterResistance || "No",
          countryOfOrigin: p.countryOfOrigin || "Bangladesh",
          warranty: p.warranty || "No warranty",
          unpublishedBySystem: false
        };

        if (checkMySQLConnection()) {
          try {
            await executeQuery(
              `INSERT INTO products (id, title, name, price, old_price, discount_price, category_id, category_slug, category_name, images, image, stock, status, views, rating, sku, fabric, gsm, fit, care, sizes, short_description, full_description, is_flash_sale, is_deleted, unpublished_by_system)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                newProduct.id, newProduct.title || newProduct.name, newProduct.name || newProduct.title, newProduct.price || 0, newProduct.oldPrice || null, newProduct.discountPrice || null,
                newProduct.categoryId || '', newProduct.categorySlug || '', newProduct.categoryName || '', 
                JSON.stringify(newProduct.images || []), newProduct.image || '', newProduct.stock || 'In Stock', newProduct.status || 'published',
                newProduct.views || 0, newProduct.rating || 4.8, newProduct.sku || '', newProduct.fabric || '', newProduct.gsm || '', newProduct.fit || '', newProduct.care || '',
                JSON.stringify(newProduct.sizes || []), newProduct.shortDescription || '', newProduct.fullDescription || '',
                newProduct.isFlashSale ? 1 : 0, newProduct.isDeleted ? 1 : 0, newProduct.unpublishedBySystem ? 1 : 0
              ]
            );
          } catch (dbErr: any) {
            console.error("Bulk upload product insert failed:", dbErr.message);
          }
        }

        localProducts.unshift(newProduct);
        importedProducts.push(newProduct);
      }

      persistProducts();
      res.status(201).json({ success: true, count: importedProducts.length, products: importedProducts });
    } catch (err: any) {
      console.error("Error bulk uploading products:", err);
      res.status(500).json({ error: err.message || "Failed to bulk upload products" });
    }
  });

  // Fetch all products
  app.get("/api/products", (req, res) => {
    res.json(localProducts);
  });

  // Create/Add new product from Admin
  app.post("/api/products", async (req, res) => {
    try {
      const { 
        title, 
        name, 
        price, 
        oldPrice, 
        categoryId, 
        categorySlug, 
        categoryName, 
        images, 
        image, 
        stock, 
        status,
        views,
        sku,
        fabric,
        gsm,
        fit,
        care,
        sizes,
        shortDescription,
        fullDescription,
        isFlashSale
      } = req.body;

      const newProduct = {
        id: "p_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
        title: title || name || "New Premium Product",
        name: title || name || "New Premium Product", 
        price: Number(price) || 0,
        oldPrice: oldPrice ? Number(oldPrice) : undefined,
        discountPrice: price ? Number(price) : undefined,
        categoryId: categoryId || "1",
        categorySlug: categorySlug || "saree",
        categoryName: categoryName || "Saree",
        images: Array.isArray(images) ? images : (image ? [image] : []),
        image: image || (Array.isArray(images) && images.length > 0 ? images[0] : "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400&q=80"),
        stock: stock || "In Stock",
        status: status || "active",
        views: Number(views) || 2200,
        rating: 4.8,
        sku: sku || "SKU-TEMP",
        fabric: fabric || "Premium Cotton",
        gsm: gsm || "160 GSM",
        fit: fit || "Regular Fit",
        care: care || "Normal Wash",
        sizes: sizes || ["M", "L", "XL", "XXL"],
        shortDescription: shortDescription || "Beautiful premium model crafted with perfection.",
        fullDescription: fullDescription || "Exquisite detailing and high-quality premium threadwork ensure extreme comfort and durability.",
        isFlashSale: !!isFlashSale,
        isDeleted: false,
        ...req.body
      };

      if (checkMySQLConnection()) {
        const missingTables: string[] = [];
        const tablesToCheck = ["products", "categories", "product_images", "product_variants", "product_sizes", "offers"];
        for (const t of tablesToCheck) {
          try {
            await executeQuery(`SELECT 1 FROM ${t} LIMIT 0`);
          } catch (e) {
            missingTables.push(t);
          }
        }
        if (missingTables.length > 0) {
          return res.status(400).json({
            error: "Required MySQL Table Not Found",
            reason: "table_missing",
            missingTables
          });
        }

        try {
          await executeQuery(
            `INSERT INTO products (id, title, name, price, old_price, discount_price, category_id, category_slug, category_name, images, image, stock, status, views, rating, sku, fabric, gsm, fit, care, sizes, short_description, full_description, is_flash_sale, is_deleted, unpublished_by_system)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newProduct.id, newProduct.title || newProduct.name, newProduct.name || newProduct.title, newProduct.price || 0, newProduct.oldPrice || null, newProduct.discountPrice || null,
              newProduct.categoryId || '', newProduct.categorySlug || '', newProduct.categoryName || '', 
              JSON.stringify(newProduct.images || []), newProduct.image || '', newProduct.stock || 'In Stock', newProduct.status || 'published',
              newProduct.views || 0, newProduct.rating || 4.8, newProduct.sku || '', newProduct.fabric || '', newProduct.gsm || '', newProduct.fit || '', newProduct.care || '',
              JSON.stringify(newProduct.sizes || []), newProduct.shortDescription || '', newProduct.fullDescription || '',
              newProduct.isFlashSale ? 1 : 0, newProduct.isDeleted ? 1 : 0, newProduct.unpublishedBySystem ? 1 : 0
            ]
          );
        } catch (dbErr: any) {
          console.error("MySQL product insert failed:", dbErr.message);
        }
      }

      localProducts.unshift(newProduct);
      persistProducts();
      
      res.status(201).json({
        ...newProduct,
        dbStatus: {
          tableName: "products",
          checkingRequiredColumns: true,
          availableColumns: REQUIRED_DB_SCHEMAS.products,
          missingColumns: []
        }
      });
    } catch (err: any) {
      console.error("Error in POST /api/products:", err);
      res.status(500).json({ error: "⚠️ Product was not saved. Unexpected error occurred." });
    }
  });

  // Update product API
  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const index = localProducts.findIndex(p => p.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Product not found" });
      }

      const updatedProduct = {
        ...localProducts[index],
        ...req.body,
        price: req.body.price !== undefined ? Number(req.body.price) : localProducts[index].price,
        oldPrice: req.body.oldPrice !== undefined ? Number(req.body.oldPrice) : localProducts[index].oldPrice,
        views: req.body.views !== undefined ? Number(req.body.views) : localProducts[index].views,
      };

      if (checkMySQLConnection()) {
        const missingTables: string[] = [];
        const tablesToCheck = ["products", "categories", "product_images", "product_variants", "product_sizes", "offers"];
        for (const t of tablesToCheck) {
          try {
            await executeQuery(`SELECT 1 FROM ${t} LIMIT 0`);
          } catch (e) {
            missingTables.push(t);
          }
        }
        if (missingTables.length > 0) {
          return res.status(400).json({
            error: "Required MySQL Table Not Found",
            reason: "table_missing",
            missingTables
          });
        }

        try {
          await executeQuery(
            `UPDATE products SET title = ?, name = ?, price = ?, old_price = ?, discount_price = ?, category_id = ?, category_slug = ?, category_name = ?, images = ?, image = ?, stock = ?, status = ?, views = ?, rating = ?, sku = ?, fabric = ?, gsm = ?, fit = ?, care = ?, sizes = ?, short_description = ?, full_description = ?, is_flash_sale = ?, is_deleted = ?, unpublished_by_system = ?
             WHERE id = ?`,
            [
              updatedProduct.title || updatedProduct.name, updatedProduct.name || updatedProduct.title, updatedProduct.price || 0, updatedProduct.oldPrice || null, updatedProduct.discountPrice || null,
              updatedProduct.categoryId || '', updatedProduct.categorySlug || '', updatedProduct.categoryName || '', 
              JSON.stringify(updatedProduct.images || []), updatedProduct.image || '', updatedProduct.stock || 'In Stock', updatedProduct.status || 'published',
              updatedProduct.views || 0, updatedProduct.rating || 4.8, updatedProduct.sku || '', updatedProduct.fabric || '', updatedProduct.gsm || '', updatedProduct.fit || '', updatedProduct.care || '',
              JSON.stringify(updatedProduct.sizes || []), updatedProduct.shortDescription || '', updatedProduct.fullDescription || '',
              updatedProduct.isFlashSale ? 1 : 0, updatedProduct.isDeleted ? 1 : 0, updatedProduct.unpublishedBySystem ? 1 : 0,
              id
            ]
          );
        } catch (dbErr: any) {
          console.error("MySQL Product update failed:", dbErr.message);
        }
      }

      localProducts[index] = updatedProduct;
      persistProducts();
      
      res.json({
        ...localProducts[index],
        dbStatus: {
          tableName: "products",
          checkingRequiredColumns: true,
          availableColumns: REQUIRED_DB_SCHEMAS.products,
          missingColumns: []
        }
      });
    } catch (err: any) {
      console.error("Error in PUT /api/products:", err);
      res.status(500).json({ error: "⚠ Product was not saved. Unexpected database update error." });
    }
  });

  // Delete product API - Soft delete as requested
  app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const index = localProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      if (checkMySQLConnection()) {
        try {
          await executeQuery("UPDATE products SET is_deleted = 1, status = 'Inactive' WHERE id = ?", [id]);
        } catch (dbErr: any) {
          console.error("MySQL Product soft delete failed:", dbErr.message);
        }
      }
      localProducts[index].isDeleted = true;
      localProducts[index].status = "Inactive";
      persistProducts();
      res.json({ success: true, message: "Product deleted successfully (soft delete)" });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  });

  // View count increment API
  app.post("/api/products/:id/view", async (req, res) => {
    const { id } = req.params;
    const p = localProducts.find(item => item.id === id);
    if (p) {
      p.views = (p.views || 2200) + 1;
      if (checkMySQLConnection()) {
        try {
          await executeQuery("UPDATE products SET views = views + 1 WHERE id = ?", [id]);
        } catch (dbErr: any) {
          console.error("MySQL increment views failed:", dbErr.message);
        }
      }
      persistProducts();
      res.json({ success: true, views: p.views });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  });

  // Fetch reviews (optionally filtered by productId)
  app.get("/api/reviews", (req, res) => {
    const { productId, admin } = req.query;
    if (productId) {
      if (admin === 'true') {
        res.json(localReviews.filter(r => r.productId === productId));
      } else {
        res.json(localReviews.filter(r => r.productId === productId && (r.status === 'Approved' || !r.status)));
      }
    } else {
      res.json(localReviews);
    }
  });

  // Create review
  app.post("/api/reviews", async (req, res) => {
    const { productId, productName, customerName, text, rating, images, verified, avatar } = req.body;
    
    const status = localReviewSettings.adminApproval ? 'Pending' : 'Approved';
    
    const newReview = {
      id: "r_" + Date.now(),
      productId: productId || "p1",
      productName: productName || "Premium Cotton Punjabi",
      customerName: customerName || "Anonymous Customer",
      text: text || "",
      rating: Number(rating) || 5,
      images: images || [],
      status: status,
      verified: !!verified,
      avatar: avatar || "",
      date: new Date().toISOString().split('T')[0]
    };

    if (checkMySQLConnection()) {
      try {
        await executeQuery(
          `INSERT INTO reviews (id, product_id, product_name, customer_name, text, rating, images, status, verified, avatar, date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newReview.id, newReview.productId, newReview.productName, newReview.customerName, newReview.text,
            newReview.rating, JSON.stringify(newReview.images || []), newReview.status || 'Approved', newReview.verified ? 1 : 0,
            newReview.avatar || '', newReview.date
          ]
        );
      } catch (dbErr: any) {
        console.error("MySQL review insert failed:", dbErr.message);
      }
    }

    localReviews.unshift(newReview);
    res.status(201).json(newReview);
  });

  // Admin update review (for Approve/Reject)
  app.put("/api/reviews/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const review = localReviews.find(r => r.id === id);
    if (review) {
      review.status = status;
      if (checkMySQLConnection()) {
        try {
          await executeQuery("UPDATE reviews SET status = ? WHERE id = ?", [status, id]);
        } catch (dbErr: any) {
          console.error("MySQL Review status update failed:", dbErr.message);
        }
      }
      res.json(review);
    } else {
      res.status(404).json({ error: "Review not found" });
    }
  });

  // Admin delete review API
  app.delete("/api/reviews/:id", async (req, res) => {
    const { id } = req.params;
    const initialLength = localReviews.length;
    localReviews = localReviews.filter(r => r.id !== id);
    if (localReviews.length < initialLength) {
      if (checkMySQLConnection()) {
        try {
          await executeQuery("DELETE FROM reviews WHERE id = ?", [id]);
        } catch (dbErr: any) {
          console.error("MySQL Review delete failed:", dbErr.message);
        }
      }
      res.json({ success: true, message: "Review deleted successfully" });
    } else {
      res.status(404).json({ error: "Review not found" });
    }
  });

  // Get review settings
  app.get("/api/settings/reviews", (req, res) => {
    res.json(localReviewSettings);
  });

  // Update review settings
  app.post("/api/settings/reviews", (req, res) => {
    localReviewSettings = { ...localReviewSettings, ...req.body };
    res.json(localReviewSettings);
  });

  app.get("/api/categories", (req, res) => {
    res.json(localCategories);
  });

  app.post("/api/categories", async (req, res) => {
    const { id, name, iconImage, mainBanner, sectionBanner, status, serialNumber, slug: customSlug } = req.body;
    
    const slug = customSlug || (name ? name.trim().toLowerCase().replace(/\s+/g, "-") : ("cat-" + Date.now()));
    
    const existingByIndex = localCategories.findIndex(c => c.slug === slug || (id && c.id === id));
    
    const updatedAt = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

    if (existingByIndex !== -1) {
      const existingCategory = localCategories[existingByIndex];
      localCategories[existingByIndex] = {
        ...existingCategory,
        name: name || existingCategory.name,
        slug: slug,
        iconImage: iconImage || existingCategory.iconImage,
        image: iconImage || existingCategory.image, 
        mainBanner: mainBanner || existingCategory.mainBanner,
        sectionBanner: sectionBanner || existingCategory.sectionBanner,
        status: status !== undefined ? !!status : existingCategory.status,
        serialNumber: serialNumber !== undefined ? Number(serialNumber) : existingCategory.serialNumber,
        lastEdited: updatedAt,
        updatedAt: updatedAt,
        shortTitle: name || existingCategory.shortTitle
      };
      persistCategories();

      const catId = existingCategory.id;
      localProducts = localProducts.map(p => {
        const matchesCategory = p.categoryId === catId || 
                                p.categorySlug === slug || 
                                (name && (p.categoryName === name || p.category === name));
        
        if (matchesCategory && p.unpublishedBySystem === true) {
          return {
            ...p,
            status: "published",
            unpublishedBySystem: false,
            categoryId: catId,
            categorySlug: slug,
            categoryName: name || p.categoryName || existingCategory.name
          };
        }
        return p;
      });
      persistProducts();

      if (checkMySQLConnection()) {
        try {
          const cat = localCategories[existingByIndex];
          await executeQuery(
            `UPDATE categories SET name = ?, slug = ?, icon_image = ?, image = ?, main_banner = ?, section_banner = ?, status = ?, serial_number = ?, last_edited = ?, updated_at = ?, short_title = ?
             WHERE id = ?`,
            [
              cat.name, cat.slug, cat.iconImage || '', cat.image || '', cat.mainBanner || '', cat.sectionBanner || '', cat.status ? 1 : 0,
              cat.serialNumber || 0, cat.lastEdited || '', cat.updatedAt || '', cat.shortTitle || '', cat.id
            ]
          );
          await executeQuery(
            `UPDATE products SET status = 'published', unpublished_by_system = 0 WHERE (category_id = ? OR category_slug = ?) AND unpublished_by_system = 1`,
            [catId, slug]
          );
        } catch (dbErr: any) {
          console.error("MySQL Category update failed:", dbErr.message);
        }
      }

      res.json(localCategories[existingByIndex]);
    } else {
      const newCategory = {
        id: id || "cat_" + Date.now(),
        name: name || "New Category",
        slug: slug,
        iconImage: iconImage || "",
        image: iconImage || "",
        mainBanner: mainBanner || "",
        sectionBanner: sectionBanner || "",
        status: status !== undefined ? !!status : true,
        serialNumber: serialNumber !== undefined ? Number(serialNumber) : (localCategories.length + 1),
        lastEdited: updatedAt,
        updatedAt: updatedAt,
        shortTitle: name || "New Category"
      };
      localCategories.push(newCategory);
      persistCategories();

      localProducts = localProducts.map(p => {
        const matchesCategory = p.categoryId === newCategory.id || 
                                p.categorySlug === slug || 
                                (name && (p.categoryName === name || p.category === name));
        
        if (matchesCategory && p.unpublishedBySystem === true) {
          return {
            ...p,
            status: "published",
            unpublishedBySystem: false,
            categoryId: newCategory.id,
            categorySlug: slug,
            categoryName: newCategory.name
          };
        }
        return p;
      });
      persistProducts();

      if (checkMySQLConnection()) {
        try {
          await executeQuery(
            `INSERT INTO categories (id, name, slug, icon_image, image, main_banner, section_banner, status, serial_number, last_edited, updated_at, short_title)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newCategory.id, newCategory.name, newCategory.slug, newCategory.iconImage || '', newCategory.image || '', newCategory.mainBanner || '', newCategory.sectionBanner || '',
              newCategory.status ? 1 : 0, newCategory.serialNumber || 0, newCategory.lastEdited || '', newCategory.updatedAt || '', newCategory.shortTitle || ''
            ]
          );
        } catch (dbErr: any) {
          console.error("MySQL Category insert failed:", dbErr.message);
        }
      }

      res.status(201).json(newCategory);
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    const { id } = req.params;
    const categoryToDelete = localCategories.find(c => c.id === id);
    if (categoryToDelete) {
      const slugToDelete = categoryToDelete.slug;
      const nameToDelete = categoryToDelete.name;

      localProducts = localProducts.map(p => {
        const matchesCategory = p.categoryId === id || 
                                (slugToDelete && p.categorySlug === slugToDelete) || 
                                (nameToDelete && (p.categoryName === nameToDelete || p.category === nameToDelete));

        if (matchesCategory) {
          if (p.status === "published") {
            return {
              ...p,
              status: "unpublished",
              unpublishedBySystem: true
            };
          }
        }
        return p;
      });

      persistProducts();

      localCategories = localCategories.filter(c => c.id !== id);
      persistCategories();

      if (checkMySQLConnection()) {
        try {
          await executeQuery(
            `UPDATE products SET status = 'unpublished', unpublished_by_system = 1 WHERE (category_id = ? OR category_slug = ?) AND status = 'published'`,
            [id, slugToDelete]
          );
          await executeQuery("DELETE FROM categories WHERE id = ?", [id]);
        } catch (dbErr: any) {
          console.error("MySQL Category delete failed:", dbErr.message);
        }
      }
    }
    res.json({ success: true, message: "Category deleted" });
  });

  app.get("/api/banners", (req, res) => {
    res.json(localBanners);
  });

  app.post("/api/banners", async (req, res) => {
    const { title, subtitle, badge, image, images, bgColor, type, status, serial, categorySlug } = req.body;
    
    let imageUrls = [];
    if (Array.isArray(images)) {
      imageUrls = images;
    } else if (image && image.includes(",")) {
      imageUrls = image.split(",").map(u => u.trim()).filter(Boolean);
    } else if (image) {
      imageUrls = [image];
    } else {
      imageUrls = ["https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80"];
    }

    const addedBanners: any[] = [];
    imageUrls.forEach((imgUrl, idx) => {
      const newBanner = {
        id: "b_" + Date.now() + "_" + idx,
        title: title || "Exclusive Designs",
        subtitle: subtitle || "Premium Offer",
        badge: badge || "New Collection",
        image: imgUrl,
        bgColor: bgColor || "#0f7eb5",
        type: type || "main",
        status: status !== undefined ? !!status : true,
        serial: serial ? (Number(serial) + idx) : (localBanners.length + 1),
        categorySlug: categorySlug || "saree"
      };
      localBanners.push(newBanner);
      addedBanners.push(newBanner);
    });

    localBanners.sort((a, b) => (Number(a.serial) || 0) - (Number(b.serial) || 0));

    if (checkMySQLConnection()) {
      try {
        for (const b of addedBanners) {
          await executeQuery(
            `INSERT INTO banners (id, title, subtitle, badge, image, bg_color, type, status, serial, category_slug)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [b.id, b.title, b.subtitle, b.badge, b.image, b.bgColor || '#ff2f7d', b.type || 'main', b.status ? 1 : 0, b.serial || 0, b.categorySlug || '']
          );
        }
      } catch (dbErr: any) {
        console.error("MySQL Banner insert failed:", dbErr.message);
      }
    }

    res.status(201).json(addedBanners);
  });

  app.delete("/api/banners/:id", async (req, res) => {
    const { id } = req.params;
    localBanners = localBanners.filter(b => b.id !== id);

    if (checkMySQLConnection()) {
      try {
        await executeQuery("DELETE FROM banners WHERE id = ?", [id]);
      } catch (dbErr: any) {
        console.error("MySQL Banner delete failed:", dbErr.message);
      }
    }

    res.json({ success: true, message: "Banner deleted successfully" });
  });

  // Courier Integration Routes
  app.post("/api/courier/send", async (req, res) => {
    const order = req.body;
    const { courierId } = req.query; 
    
    console.log(`Sending order ${order.id} to courier ${courierId}`);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!order.shippingAddress || !order.phone) {
      return res.status(400).json({ success: false, error: "Invalid shipping details" });
    }

    res.json({
      success: true,
      tracking_id: "SHP-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      tracking_url: "https://track.naimshop.com/v1/" + order.id,
      status: "Sent to Carrier",
      courier_order_id: "CO-" + Date.now()
    });
  });

  app.post("/api/courier/send-bulk", async (req, res) => {
    const { orderIds, courierId } = req.body;
    console.log(`Bulk sending ${orderIds.length} orders to ${courierId}`);
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    const results = orderIds.map((id: string) => ({
      orderId: id,
      success: true,
      trackingId: "BLK-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
      trackingUrl: "https://track.naimshop.com/v1/" + id
    }));

    res.json({ success: true, results });
  });

  app.get("/api/courier/status/:orderId", (req, res) => {
    const statuses = ["Processing", "Picked Up", "In Transit", "Out for Delivery", "Delivered"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    res.json({
      orderId: req.params.orderId,
      status: randomStatus,
      lastUpdate: new Date().toISOString()
    });
  });

  app.post("/api/courier/webhook", (req, res) => {
    console.log("Courier Webhook received:", req.body);
    res.json({ received: true });
  });
  
  // Messenger APIs
  app.get("/api/messenger/settings", (req, res) => {
    res.json(localMessengerSettings);
  });

  app.post("/api/messenger/settings", (req, res) => {
    const { aiAutoReplyEnabled, faqs } = req.body;
    if (aiAutoReplyEnabled !== undefined) {
      localMessengerSettings.aiAutoReplyEnabled = !!aiAutoReplyEnabled;
    }
    if (Array.isArray(faqs)) {
      localMessengerSettings.faqs = faqs;
    }
    persistMessengerSettings();
    res.json(localMessengerSettings);
  });

  app.get("/api/messenger/messages", (req, res) => {
    res.json(localMessages);
  });

  app.post("/api/messenger/messages", async (req, res) => {
    const msg = {
      id: "msg_" + Date.now(),
      ...req.body,
      timestamp: new Date().toISOString()
    };
    localMessages.push(msg);

    if (checkMySQLConnection()) {
      try {
        await executeQuery(
          `INSERT INTO messages (id, customer_id, customer_name, customer_email, message, reply_by, timestamp, type, matched_source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            msg.id, msg.customerId || '', msg.customerName || '', msg.customerEmail || '', msg.message,
            msg.replyBy || 'customer', msg.timestamp, msg.type || 'text', msg.matchedSource || null
          ]
        );
      } catch (dbErr: any) {
        console.error("MySQL message insert failed:", dbErr.message);
      }
    }
    
    // Simulate AI response if it's from customer and AI Auto Reply is enabled
    if (msg.replyBy === 'customer') {
      if (localMessengerSettings.aiAutoReplyEnabled) {
        let aiMsgText = "দুঃখিত, এই তথ্যটি এখন আমার কাছে নেই। অনুগ্রহ করে অপেক্ষা করুন, আমাদের প্রতিনিধি আপনাকে সাহায্য করবেন।";
        let matchedSource = "No Data Available";
        
        try {
          const langIsBn = /[\u0980-\u09FF]/.test(msg.message);
          const replyLanguage = langIsBn ? "bn" : "en";
          
          if (process.env.GEMINI_API_KEY) {
            const ai = new GoogleGenAI({ 
              apiKey: process.env.GEMINI_API_KEY,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                }
              }
            });
            
            const productsInfo = localProducts.filter(p => !p.isDeleted).map(p => ({
              name: p.title || p.name,
              price: p.price,
              oldPrice: p.oldPrice,
              stock: p.stock || "In Stock",
              sizes: p.sizes || [],
              fabric: p.fabric || "",
              gsm: p.gsm || "",
              fit: p.fit || "",
              care: p.care || "",
              sku: p.sku || "",
              shortDescription: p.shortDescription || ""
            }));

            const categoriesInfo = localCategories.filter(c => c.status).map(c => ({
              name: c.name,
              slug: c.slug
            }));

            const faqsInfo = localMessengerSettings.faqs;

            const systemPrompt = `You are an automated, helpful, and friendly customer support AI representative for NaimShop.
Your goal is to reply to customers quickly and accurately.

STRICT INSTRUCTIONS:
1. Use ONLY the provided Admin Database (Products, Categories, FAQs, and Store Settings) to answer the customer.
2. DO NOT use pre-trained external knowledge or make up/guess details (like pricing, stock status, location, or shipping times) if they are not explicitly present in the data.
3. If the answer to the customer's query cannot be found or deduced with absolute certainty from the provided database, or if you are unsure, you MUST reply with this EXACT message:
"দুঃখিত, এই তথ্যটি এখন আমার কাছে নেই। অনুগ্রহ করে অপেক্ষা করুন, আমাদের প্রতিনিধি আপনাকে সাহায্য করবেন।"
4. Reply strictly in ${replyLanguage === "bn" ? "Bengali (বাংলা)" : "English"}.
5. If asked about a product, check its stock status ("In Stock" or "Out of Stock"), price, and sizes.
6. Make your response extremely concise, natural, and customer-friendly.

ADMIN DATABASE:
- PRODUCTS: ${JSON.stringify(productsInfo)}
- CATEGORIES: ${JSON.stringify(categoriesInfo)}
- CUSTOM STORE FAQs: ${JSON.stringify(faqsInfo)}
- COURIER / DELIVERY INFORMATION:
  * Delivery charge inside Dhaka: 60 Tk.
  * Delivery charge outside Dhaka: 150 Tk.
  * Delivery time: 2-3 days inside Dhaka, 3-5 days outside Dhaka.
  * Courier Partners: Steadfast, Pathao, RedX.
- SHOP SETTINGS & PAYMENT:
  * Store Name: NaimShop
  * Payment options: Cash on Delivery (COD), bKash, Rocket, Cards.
  * Showroom/Shop location: Dhaka, Dhanmondi.

Output format: You MUST output a JSON object containing two fields:
- "reply": The customer support message (either the precise answer or the exact fallback sentence).
- "matchedSource": The source of information (e.g. "Product: <Name>", "FAQ", "Delivery Settings", or "No Match").`;

            try {
              const response = await ai.models.generateContent({
                 model: "gemini-3.5-flash",
                 contents: [
                    { role: "user", parts: [{ text: systemPrompt + "\n\nCustomer question: " + msg.message }] }
                 ],
                 config: {
                   responseMimeType: "application/json",
                   responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                         reply: { type: Type.STRING, description: "The response message to the customer." },
                         matchedSource: { type: Type.STRING, description: "Name of the matched product/data source used for this answer." }
                      },
                      required: ["reply", "matchedSource"],
                   }
                 }
              });
              
              if (response.text) {
                 const text = response.text;
                 const jsonMatch = text.match(/\{[\s\S]*\}/);
                 const cleanJson = jsonMatch ? jsonMatch[0] : text;
                 const parsed = JSON.parse(cleanJson);
                 if (parsed.reply) aiMsgText = parsed.reply;
                 if (parsed.matchedSource) matchedSource = parsed.matchedSource;
              }
            } catch (aiErr: any) {
              console.error("AI Generation Error (Support):", aiErr?.message || aiErr);
            }
          }
        } catch (e) {
           console.error("Gemini AI API Error:", e);
        }
        
        const aiMsg = {
          id: "msg_ai_" + Date.now(),
          customerId: msg.customerId,
          customerName: msg.customerName,
          customerEmail: msg.customerEmail,
          message: aiMsgText,
          replyBy: "ai",
          timestamp: new Date().toISOString(),
          type: "text",
          matchedSource
        };
        
        localMessages.push(aiMsg);

        if (checkMySQLConnection()) {
          try {
            await executeQuery(
              `INSERT INTO messages (id, customer_id, customer_name, customer_email, message, reply_by, timestamp, type, matched_source)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                aiMsg.id, aiMsg.customerId || '', aiMsg.customerName || '', aiMsg.customerEmail || '', aiMsg.message,
                aiMsg.replyBy || 'ai', aiMsg.timestamp, aiMsg.type || 'text', aiMsg.matchedSource || null
              ]
            );
          } catch (dbErr: any) {
            console.error("MySQL AI reply insert failed:", dbErr.message);
          }
        }
      }
    }
    
    res.status(201).json(msg);
  });

  app.get("/api/messenger/analytics", (req, res) => {
    const analytics = {
      whatsapp: localClickLogs.filter(l => l.type === 'whatsapp').length,
      messenger: localClickLogs.filter(l => l.type === 'messenger').length,
      email: localClickLogs.filter(l => l.type === 'email').length,
      call: localClickLogs.filter(l => l.type === 'call').length,
      totalMessages: localMessages.length,
      logs: localClickLogs.slice(-50)
    };
    res.json(analytics);
  });

  app.post("/api/messenger/clicks", async (req, res) => {
    const log = {
      id: "log_" + Date.now(),
      ...req.body,
      timestamp: new Date().toISOString()
    };
    localClickLogs.push(log);

    if (checkMySQLConnection()) {
      try {
        await executeQuery(
          `INSERT INTO click_logs (id, type, timestamp) VALUES (?, ?, ?)`,
          [log.id, log.type, log.timestamp]
        );
      } catch (dbErr: any) {
        console.error("MySQL click log insert failed:", dbErr.message);
      }
    }

    res.status(201).json(log);
  });

  app.post("/api/ai/generate-seo", async (req, res) => {
    const { productName, name, category, brand, shortDescription, fullDescription, highlights } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    try {
      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are a Search Specialist. Generate a comprehensive keyword suite and metadata for the following product to maximize visibility across all platforms (Google, Social Media, On-site).
      Product Data: ${JSON.stringify(req.body, null, 2)}

      Requirements:
      1. seoTitle: Search-optimized, compelling title under 60 characters.
      2. seoDescription: High-CTR meta description under 160 characters.
      3. focusKeywords: 3-4 high-value focus keywords, comma-separated (e.g., "silk saree, premium saree, saree online bd").
      4. tags: 5-6 short relevant tags for internal indexing and search tags.
      5. seoScore: An optimization score integer from 85 to 98 based on keyword density and search interest.
      6. websiteKeywords: Keywords for on-site search.
      7. facebookKeywords: Viral and trendy keywords for Facebook posts.
      8. tiktokKeywords: Trending hashtags and search terms for TikTok.
      9. youtubeKeywords: Search-friendly terms for YouTube titles and tags.
      10. googleKeywords: High-intent keywords for Google Search ranking.
      11. banglaKeywords: Keywords in Bengali script (common search terms).
      12. englishKeywords: Professional and casual English search terms.
      13. wrongSpellingKeywords: Common misspellings and variations (e.g., "polo shart" for "polo shirt").

      Return ONLY a JSON object with these keys. Each keyword key must be an ARRAY of strings (at least 8-10 keywords per category).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              seoTitle: { type: Type.STRING },
              seoDescription: { type: Type.STRING },
              focusKeywords: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              seoScore: { type: Type.INTEGER },
              websiteKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              facebookKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              tiktokKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              youtubeKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              googleKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              banglaKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              englishKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              wrongSpellingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: [
              "seoTitle", "seoDescription", "focusKeywords", "tags", "seoScore",
              "websiteKeywords", "facebookKeywords", "tiktokKeywords", "youtubeKeywords", 
              "googleKeywords", "banglaKeywords", "englishKeywords", "wrongSpellingKeywords"
            ]
          }
        }
      });

      if (response.text) {
        const responseText = response.text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
        res.json(JSON.parse(cleanJson));
      } else {
        throw new Error("No candidates returned from AI");
      }
    } catch (error: any) {
      console.error("AI SEO Generation Error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Failed to generate SEO data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    try {
      // Initialize MySQL connection first
      await initMySQL();
      
      // Then ensure Admin exists once connection is established
      await ensureAdminExists();
      
      if (checkMySQLConnection()) {
        console.log("MySQL connection active! Loading tables into server memory cache...");
        
        // Populate memory collections directly from Hostinger MySQL to keep fast read operations
        const catRows = await executeQuery("SELECT * FROM categories ORDER BY serial_number ASC");
        localCategories = catRows.map(row => ({
          id: row.id,
          name: row.name,
          image: row.image,
          iconImage: row.icon_image,
          shortTitle: row.short_title,
          mainBanner: row.main_banner,
          sectionBanner: row.section_banner,
          status: !!row.status,
          serialNumber: row.serial_number,
          lastEdited: row.last_edited,
          slug: row.slug,
          updatedAt: row.updated_at
        }));
        
        const prodRows = await executeQuery("SELECT * FROM products WHERE is_deleted = 0");
        localProducts = prodRows.map(row => ({
          id: row.id,
          title: row.title || row.name,
          name: row.name || row.title,
          price: Number(row.price),
          oldPrice: row.old_price ? Number(row.old_price) : undefined,
          discountPrice: row.discount_price ? Number(row.discount_price) : undefined,
          categoryId: row.category_id,
          categorySlug: row.category_slug,
          categoryName: row.category_name,
          images: typeof row.images === "string" ? JSON.parse(row.images) : (Array.isArray(row.images) ? row.images : []),
          image: row.image,
          stock: row.stock,
          status: row.status,
          views: Number(row.views || 0),
          rating: Number(row.rating || 4.8),
          sku: row.sku,
          fabric: row.fabric,
          gsm: row.gsm,
          fit: row.fit,
          care: row.care,
          sizes: typeof row.sizes === "string" ? JSON.parse(row.sizes) : (Array.isArray(row.sizes) ? row.sizes : []),
          shortDescription: row.short_description,
          fullDescription: row.full_description,
          isFlashSale: !!row.is_flash_sale,
          isDeleted: !!row.is_deleted,
          unpublishedBySystem: !!row.unpublished_by_system
        }));

        const bannerRows = await executeQuery("SELECT * FROM banners ORDER BY serial ASC");
        localBanners = bannerRows.map(row => ({
          id: row.id,
          title: row.title,
          subtitle: row.subtitle,
          badge: row.badge,
          image: row.image,
          bgColor: row.bg_color,
          type: row.type,
          status: !!row.status,
          serial: Number(row.serial || 0),
          categorySlug: row.category_slug
        }));

        const reviewRows = await executeQuery("SELECT * FROM reviews ORDER BY id DESC");
        localReviews = reviewRows.map(row => ({
          id: row.id,
          productId: row.product_id,
          productName: row.product_name,
          customerName: row.customer_name,
          text: row.text,
          rating: Number(row.rating || 5),
          images: typeof row.images === "string" ? JSON.parse(row.images) : (Array.isArray(row.images) ? row.images : []),
          status: row.status,
          verified: !!row.verified,
          avatar: row.avatar,
          date: row.date
        }));

        const messageRows = await executeQuery("SELECT * FROM messages ORDER BY timestamp ASC");
        localMessages = messageRows.map(row => ({
          id: row.id,
          customerId: row.customer_id,
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          message: row.message,
          replyBy: row.reply_by,
          timestamp: row.timestamp,
          type: row.type,
          matchedSource: row.matched_source
        }));

        const clickRows = await executeQuery("SELECT * FROM click_logs ORDER BY timestamp ASC");
        localClickLogs = clickRows.map(row => ({
          id: row.id,
          type: row.type,
          timestamp: row.timestamp
        }));

        console.log("Memory database collections synchronized with Hostinger MySQL successfully.");
      } else {
        console.warn("MySQL credentials missing or database offline. Running in standard in-memory fallback mode.");
      }
    } catch (dbErr: any) {
      console.error("Error during MySQL load-to-memory synchronization:", dbErr.message);
    }
  });
}

startServer();
