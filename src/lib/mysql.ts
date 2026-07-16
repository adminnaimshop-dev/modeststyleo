import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const configPath = path.join(process.cwd(), 'local_mysql_config.json');

export function loadMySQLConfig() {
  let host = process.env.MYSQL_HOST || 'localhost';
  let port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  let database = process.env.MYSQL_DATABASE || 'u103041740_modeststylio';
  let user = process.env.MYSQL_USER || 'u103041740_modeststylio';
  let password = process.env.MYSQL_PASSWORD || 'MODEST@stylio007';

  // Check if we have a non-localhost remote host in environment variables
  const hasEnvConfig = process.env.MYSQL_HOST && process.env.MYSQL_HOST !== 'localhost' && process.env.MYSQL_HOST !== '127.0.0.1';

  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (!hasEnvConfig) {
        if (data.host) host = data.host;
        if (data.port) port = parseInt(data.port, 10);
        if (data.database) database = data.database;
        if (data.user) user = data.user;
        if (data.password) password = data.password;
      } else {
        // Keep them in sync
        fs.writeFileSync(configPath, JSON.stringify({ host, port, database, user, password }, null, 2), 'utf-8');
      }
    } else {
      // Create default config file if it does not exist
      fs.writeFileSync(configPath, JSON.stringify({ host, port, database, user, password }, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error reading/writing local_mysql_config.json:', err);
  }

  return { host, port, database, user, password };
}

export function saveMySQLConfig(config: any) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving local_mysql_config.json:', err);
    return false;
  }
}

let pool: mysql.Pool | null = null;
let isConnected = false;

// Initialize connection pool with retry system
export async function initMySQL(retries = 3, delayMs = 5000): Promise<mysql.Pool> {
  if (pool) return pool;

  const activeConfig = loadMySQLConfig();
  console.log(`Connecting to MySQL database at ${activeConfig.host}:${activeConfig.port}...`);
  
  // If host is localhost or 127.0.0.1, restrict retries to 1 to prevent blocking server startup
  const isLocal = activeConfig.host === 'localhost' || activeConfig.host === '127.0.0.1';
  const maxRetries = isLocal ? 1 : retries;
  const actualDelay = isLocal ? 1000 : delayMs;

  for (let i = 1; i <= maxRetries; i++) {
    try {
      const isUnconfigured = !activeConfig.host || activeConfig.host === 'localhost' || activeConfig.host === '127.0.0.1';
      
      if (isUnconfigured && i === 1) {
        console.warn(`⚠️ MySQL Configuration Warning: Using default host '${activeConfig.host}'. If you are using Hostinger MySQL, please update your credentials in the Admin > Database Setup panel.`);
      }

      // First, try to connect to the server without a specific database to see if it exists
      const rootPool = mysql.createPool({
        host: activeConfig.host,
        port: activeConfig.port,
        user: activeConfig.user,
        password: activeConfig.password,
        waitForConnections: true,
        connectionLimit: 1,
        connectTimeout: 5000
      });

      try {
        await rootPool.execute(`CREATE DATABASE IF NOT EXISTS \`${activeConfig.database}\``);
        console.log(`Database '${activeConfig.database}' verified/created.`);
      } catch (dbErr: any) {
        if (dbErr.code === 'ER_ACCESS_DENIED_ERROR') {
          console.error(`❌ Authentication Error: Access denied for ${activeConfig.user}@${activeConfig.host}. Check your credentials.`);
        } else {
          console.warn(`Could not verify/create database '${activeConfig.database}' automatically:`, dbErr.message);
        }
      } finally {
        await rootPool.end();
      }

      pool = mysql.createPool({
        host: activeConfig.host,
        port: activeConfig.port,
        user: activeConfig.user,
        password: activeConfig.password,
        database: activeConfig.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        charset: 'utf8mb4',
        connectTimeout: 5000
      });

      // Test connection
      const connection = await pool.getConnection();
      console.log('Successfully connected to MySQL database via Pool.');
      connection.release();
      isConnected = true;
      
      // Run automatic migrations & seeding to ensure Hostinger MySQL is fully configured
      await runMigrationsAndSeeding();
      
      return pool;
    } catch (err: any) {
      let specificError = err.message;
      if (err.code === 'ECONNREFUSED') specificError = `Host Error: Connection refused at ${activeConfig.host}:${activeConfig.port}. Check if your MySQL server is running.`;
      if (err.code === 'ER_ACCESS_DENIED_ERROR') specificError = `Authentication Error: Invalid username or password for ${activeConfig.user}@${activeConfig.host}.`;
      if (err.code === 'ER_BAD_DB_ERROR') specificError = `Database Not Found: The database '${activeConfig.database}' does not exist on this server.`;
      if (err.code === 'ENOTFOUND') specificError = `Host Not Found: Could not resolve hostname '${activeConfig.host}'. Check your internet or server address.`;
      
      console.log(`MySQL connection attempt ${i} failed. Detail: ${specificError}`);
      if (pool) {
        await pool.end();
        pool = null;
      }
      if (i === maxRetries) {
        console.error('CRITICAL: MySQL connection unavailable after all retries.');
        return null as any;
      }
      console.log(`Retrying in ${actualDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, actualDelay));
    }
  }
  return null as any;
}

export async function reinitMySQL(config?: any): Promise<{ success: boolean; error?: string }> {
  // End existing pool if exists
  if (pool) {
    try {
      await pool.end();
    } catch (e) {}
    pool = null;
  }
  isConnected = false;

  const activeConfig = config || loadMySQLConfig();
  console.log(`Re-initializing MySQL connection pool at ${activeConfig.host}:${activeConfig.port}...`);

  try {
    const tempPool = mysql.createPool({
      host: activeConfig.host,
      port: activeConfig.port,
      user: activeConfig.user,
      password: activeConfig.password,
      database: activeConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      charset: 'utf8mb4',
      connectTimeout: 5000
    });

    const connection = await tempPool.getConnection();
    console.log('Successfully connected to MySQL database via Pool.');
    connection.release();
    
    pool = tempPool;
    isConnected = true;

    // Run automatic migrations & seeding to ensure Hostinger MySQL is fully configured
    await runMigrationsAndSeeding();
    return { success: true };
  } catch (err: any) {
    let specificError = err.message;
    if (err.code === 'ECONNREFUSED') specificError = `Host Error: Connection refused at ${activeConfig.host}:${activeConfig.port}.`;
    if (err.code === 'ER_ACCESS_DENIED_ERROR') specificError = `Authentication Error: Invalid username or password.`;
    if (err.code === 'ER_BAD_DB_ERROR') specificError = `Database Not Found: '${activeConfig.database}'.`;
    
    console.error('MySQL dynamic re-initialization failed:', specificError);
    return { success: false, error: specificError };
  }
}

export function getMySQLPool(): mysql.Pool | null {
  return pool;
}

export function checkMySQLConnection(): boolean {
  return isConnected && pool !== null;
}

// Parameterized safe query runner
export async function executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const activePool = getMySQLPool();
  if (!activePool) {
    throw new Error('MySQL connection pool is not initialized.');
  }
  try {
    const [rows] = await activePool.execute(sql, params);
    return rows as T[];
  } catch (err: any) {
    console.error('MySQL execution error for SQL:', sql, 'Error:', err.message);
    throw err;
  }
}

// Centralized table definitions for individual creation
export const TABLE_DEFINITIONS: Record<string, string> = {
  users: `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  admins: `CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100),
    permissions JSON,
    status TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  categories: `CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image TEXT,
    icon_image TEXT,
    short_title VARCHAR(255),
    main_banner TEXT,
    section_banner TEXT,
    status TINYINT(1) DEFAULT 1,
    serial_number INT,
    last_edited VARCHAR(100),
    slug VARCHAR(255) UNIQUE,
    updated_at VARCHAR(100)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  subcategories: `CREATE TABLE IF NOT EXISTS subcategories (
    id VARCHAR(100) PRIMARY KEY,
    category_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    status TINYINT(1) DEFAULT 1,
    serial_number INT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  products: `CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255),
    name VARCHAR(255),
    price DECIMAL(12, 2) NOT NULL,
    old_price DECIMAL(12, 2),
    discount_price DECIMAL(12, 2),
    category_id VARCHAR(100),
    category_slug VARCHAR(255),
    category_name VARCHAR(255),
    brand_id VARCHAR(100),
    images JSON,
    image TEXT,
    stock VARCHAR(100) DEFAULT 'In Stock',
    status VARCHAR(100) DEFAULT 'published',
    views INT DEFAULT 0,
    rating DECIMAL(3, 1) DEFAULT 4.8,
    sku VARCHAR(100),
    fabric VARCHAR(255),
    gsm VARCHAR(50),
    fit VARCHAR(100),
    care VARCHAR(255),
    sizes JSON,
    short_description TEXT,
    full_description TEXT,
    is_flash_sale TINYINT(1) DEFAULT 0,
    is_deleted TINYINT(1) DEFAULT 0,
    unpublished_by_system TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  product_images: `CREATE TABLE IF NOT EXISTS product_images (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    serial_number INT DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  product_variants: `CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL,
    color VARCHAR(100),
    size VARCHAR(50),
    stock INT DEFAULT 0,
    price DECIMAL(12, 2)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  product_sizes: `CREATE TABLE IF NOT EXISTS product_sizes (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL,
    size_name VARCHAR(50) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  brands: `CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    logo TEXT,
    status TINYINT(1) DEFAULT 1
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  orders: `CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(100),
    total_amount DECIMAL(12, 2) NOT NULL,
    shipping_fee DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(100) DEFAULT 'Pending',
    payment_status VARCHAR(100) DEFAULT 'Unpaid',
    payment_method VARCHAR(100),
    courier_name VARCHAR(100),
    tracking_number VARCHAR(255),
    billing_details JSON,
    shipping_details JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  order_items: `CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(255),
    quantity INT DEFAULT 1,
    price DECIMAL(12, 2) NOT NULL,
    variant_info JSON
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  customers: `CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100),
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  customer_addresses: `CREATE TABLE IF NOT EXISTS customer_addresses (
    id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'shipping',
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    is_default TINYINT(1) DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  cart: `CREATE TABLE IF NOT EXISTS cart (
    id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(100),
    product_id VARCHAR(100),
    quantity INT DEFAULT 1,
    variant_id VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  wishlist: `CREATE TABLE IF NOT EXISTS wishlist (
    id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  coupons: `CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    discount_type VARCHAR(50) DEFAULT 'percentage',
    discount_value DECIMAL(12, 2) NOT NULL,
    min_spend DECIMAL(12, 2) DEFAULT 0,
    expiry_date TIMESTAMP NULL,
    status TINYINT(1) DEFAULT 1
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  banners: `CREATE TABLE IF NOT EXISTS banners (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    badge VARCHAR(255),
    image TEXT,
    bg_color VARCHAR(50),
    type VARCHAR(100) DEFAULT 'main',
    status TINYINT(1) DEFAULT 1,
    serial INT,
    category_slug VARCHAR(255)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  sliders: `CREATE TABLE IF NOT EXISTS sliders (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255),
    image TEXT NOT NULL,
    link TEXT,
    status TINYINT(1) DEFAULT 1,
    serial_number INT DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  reviews: `CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(100),
    product_name VARCHAR(255),
    customer_name VARCHAR(255),
    text TEXT,
    rating INT,
    images JSON,
    status VARCHAR(100) DEFAULT 'Approved',
    verified TINYINT(1) DEFAULT 0,
    date VARCHAR(100)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  ratings: `CREATE TABLE IF NOT EXISTS ratings (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    rating INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  inventory: `CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL,
    variant_id VARCHAR(100),
    current_stock INT DEFAULT 0,
    min_stock_level INT DEFAULT 5,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  stock_logs: `CREATE TABLE IF NOT EXISTS stock_logs (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL,
    change_amount INT NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  payments: `CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    method VARCHAR(100),
    transaction_id VARCHAR(255),
    status VARCHAR(100) DEFAULT 'Completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  payment_methods: `CREATE TABLE IF NOT EXISTS payment_methods (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status TINYINT(1) DEFAULT 1,
    config JSON
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  couriers: `CREATE TABLE IF NOT EXISTS couriers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status TINYINT(1) DEFAULT 1,
    base_fee DECIMAL(12, 2) DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  shipping: `CREATE TABLE IF NOT EXISTS shipping (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    fee DECIMAL(12, 2) NOT NULL,
    status TINYINT(1) DEFAULT 1
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  invoices: `CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    invoice_number VARCHAR(100) UNIQUE,
    file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  notifications: `CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100),
    title VARCHAR(255),
    message TEXT,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  settings: `CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(100) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  activity_logs: `CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100),
    action VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  analytics: `CREATE TABLE IF NOT EXISTS analytics (
    id VARCHAR(100) PRIMARY KEY,
    event_name VARCHAR(100),
    event_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  facebook_pixel: `CREATE TABLE IF NOT EXISTS facebook_pixel (
    id VARCHAR(100) PRIMARY KEY,
    pixel_id VARCHAR(100),
    status TINYINT(1) DEFAULT 1
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  tiktok_pixel: `CREATE TABLE IF NOT EXISTS tiktok_pixel (
    id VARCHAR(100) PRIMARY KEY,
    pixel_id VARCHAR(100),
    status TINYINT(1) DEFAULT 1
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  google_analytics: `CREATE TABLE IF NOT EXISTS google_analytics (
    id VARCHAR(100) PRIMARY KEY,
    tracking_id VARCHAR(100),
    status TINYINT(1) DEFAULT 1
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  website_tracking: `CREATE TABLE IF NOT EXISTS website_tracking (
    id VARCHAR(100) PRIMARY KEY,
    visitor_id VARCHAR(100),
    path VARCHAR(255),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  messages: `CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(100),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    message TEXT,
    reply_by VARCHAR(100),
    timestamp VARCHAR(100),
    type VARCHAR(100) DEFAULT 'text',
    matched_source VARCHAR(255)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  click_logs: `CREATE TABLE IF NOT EXISTS click_logs (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(100),
    timestamp VARCHAR(100)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  offers: `CREATE TABLE IF NOT EXISTS offers (
    id VARCHAR(100) PRIMARY KEY,
    coupon_code VARCHAR(100),
    discount_text VARCHAR(255),
    free_delivery TINYINT(1) DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
};

// Run setup migrations to create tables on Hostinger MySQL
async function runMigrationsAndSeeding() {
  console.log('Running Extensive MySQL migrations to ensure all requested table schemas exist...');
  
  try {
    const tableNames = Object.keys(TABLE_DEFINITIONS);

    for (const tableName of tableNames) {
      await executeQuery(TABLE_DEFINITIONS[tableName]);
    }

    console.log('MySQL schemas validated. Proceeding to seed empty tables from local persistent data...');
    await seedMySQLFromLocalData();
    
  } catch (err: any) {
    console.error('Error in MySQL migrations:', err.message);
  }
}

// Safe seeding mechanism: if tables are empty, fill them from local JSON files
async function seedMySQLFromLocalData() {
  try {
    // 1. Seed admin / users
    const userRows = await executeQuery('SELECT COUNT(*) as count FROM users');
    if (userRows[0]?.count === 0) {
      console.log('Seeding default administrator to MySQL users...');
      // Admin email is atob('YWRtaW4ubmFpbXNob3BAZ21haWwuY29t') = admin.naimshop@gmail.com
      // We will hash 'admin' or use a direct secure representation for the demo password.
      // Let's store a simple MD5/SHA256 representation. For our auth handler, we can use simple SHA256 of 'admin'.
      // SHA256 of 'admin' is "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"
      const defaultAdminEmail = 'admin.naimshop@gmail.com';
      const defaultAdminPwdHash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // sha256 of 'admin'
      await executeQuery(
        'INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
        ['usr_admin', defaultAdminEmail, defaultAdminPwdHash, 'Naim Shop Admin', 'admin']
      );
    }

    // 2. Seed Categories
    const catRows = await executeQuery('SELECT COUNT(*) as count FROM categories');
    if (catRows[0]?.count === 0) {
      const categoriesFile = path.join(process.cwd(), 'local_categories.json');
      if (fs.existsSync(categoriesFile)) {
        console.log('Seeding categories from local JSON...');
        const categories = JSON.parse(fs.readFileSync(categoriesFile, 'utf-8'));
        for (const cat of categories) {
          await executeQuery(
            `INSERT INTO categories (id, name, image, icon_image, short_title, main_banner, section_banner, status, serial_number, last_edited, slug, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              cat.id, cat.name, cat.image || '', cat.iconImage || '', cat.shortTitle || '', 
              cat.mainBanner || '', cat.sectionBanner || '', cat.status ? 1 : 0, 
              cat.serialNumber || 0, cat.lastEdited || '', cat.slug, cat.updatedAt || ''
            ]
          );
        }
      }
    }

    // 3. Seed Products
    const prodRows = await executeQuery('SELECT COUNT(*) as count FROM products');
    if (prodRows[0]?.count === 0) {
      const productsFile = path.join(process.cwd(), 'local_products.json');
      if (fs.existsSync(productsFile)) {
        console.log('Seeding products from local JSON...');
        const products = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
        for (const p of products) {
          await executeQuery(
            `INSERT INTO products (id, title, name, price, old_price, discount_price, category_id, category_slug, category_name, images, image, stock, status, views, rating, sku, fabric, gsm, fit, care, sizes, short_description, full_description, is_flash_sale, is_deleted, unpublished_by_system)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.id, p.title || p.name, p.name || p.title, p.price || 0, p.oldPrice || null, p.discountPrice || null,
              p.categoryId || '', p.categorySlug || '', p.categoryName || '', 
              JSON.stringify(p.images || []), p.image || '', p.stock || 'In Stock', p.status || 'published',
              p.views || 0, p.rating || 4.8, p.sku || '', p.fabric || '', p.gsm || '', p.fit || '', p.care || '',
              JSON.stringify(p.sizes || []), p.shortDescription || '', p.fullDescription || '',
              p.isFlashSale ? 1 : 0, p.isDeleted ? 1 : 0, p.unpublishedBySystem ? 1 : 0
            ]
          );
        }
      }
    }

    // 4. Seed Banners
    const bannerRows = await executeQuery('SELECT COUNT(*) as count FROM banners');
    if (bannerRows[0]?.count === 0) {
      const bannersFile = path.join(process.cwd(), 'local_banners.json');
      let banners = [];
      if (fs.existsSync(bannersFile)) {
        banners = JSON.parse(fs.readFileSync(bannersFile, 'utf-8'));
      } else {
        // use default banners from src/data
        banners = [
          {
            id: 'b1',
            title: 'Heritage Saree Collection',
            subtitle: 'Elegant designs handwoven for perfection',
            badge: 'NEW ARRIVAL',
            image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&q=80',
            bgColor: '#ff2f7d',
            type: 'main',
            status: true,
            serial: 1,
            categorySlug: 'saree'
          },
          {
            id: 'b2',
            title: 'Designer Punjabis',
            subtitle: 'Traditional meets contemporary comfort',
            badge: 'TRENDING',
            image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?w=1200&q=80',
            bgColor: '#0f172a',
            type: 'main',
            status: true,
            serial: 2,
            categorySlug: 'punjabi'
          }
        ];
      }
      console.log('Seeding banners to MySQL...');
      for (const b of banners) {
        await executeQuery(
          `INSERT INTO banners (id, title, subtitle, badge, image, bg_color, type, status, serial, category_slug)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [b.id, b.title, b.subtitle, b.badge, b.image, b.bgColor || '#ff2f7d', b.type || 'main', b.status ? 1 : 0, b.serial || 0, b.categorySlug || '']
        );
      }
    }

    // 5. Seed Reviews
    const reviewRows = await executeQuery('SELECT COUNT(*) as count FROM reviews');
    if (reviewRows[0]?.count === 0) {
      console.log('Seeding empty reviews state initialized.');
    }

    // 6. Seed Messages
    const messageRows = await executeQuery('SELECT COUNT(*) as count FROM messages');
    if (messageRows[0]?.count === 0) {
      console.log('Seeding empty messages state initialized.');
    }

    console.log('MySQL Seeding finished successfully.');
  } catch (err: any) {
    console.error('Error during MySQL seeding:', err.message);
  }
}
