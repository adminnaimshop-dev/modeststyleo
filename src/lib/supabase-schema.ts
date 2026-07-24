// Centralized Supabase PostgreSQL table definitions
export const SUPABASE_TABLE_DEFINITIONS: Record<string, string> = {
  profiles: `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    last_login_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  users: `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  categories: `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT,
    icon_image TEXT,
    short_title TEXT,
    main_banner TEXT,
    section_banner TEXT,
    status BOOLEAN DEFAULT true,
    serial_number INTEGER,
    last_edited TEXT,
    slug TEXT UNIQUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  subcategories: `CREATE TABLE IF NOT EXISTS subcategories (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    status BOOLEAN DEFAULT true,
    serial_number INTEGER
  );`,

  products: `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    product_slug TEXT,
    name TEXT,
    title TEXT,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    brand TEXT,
    brand_id TEXT,
    description TEXT,
    short_description TEXT,
    full_description TEXT,
    price NUMERIC DEFAULT 0,
    regular_price NUMERIC,
    old_price NUMERIC,
    sale_price NUMERIC,
    discount_price NUMERIC,
    stock_qty INTEGER DEFAULT 0,
    stock TEXT DEFAULT 'In Stock',
    sku TEXT,
    status TEXT DEFAULT 'active',
    images JSONB,
    image TEXT,
    category_slug TEXT,
    category_name TEXT,
    fabric TEXT,
    gsm TEXT,
    fit TEXT,
    care TEXT,
    sizes JSONB,
    views INTEGER DEFAULT 0,
    rating NUMERIC DEFAULT 4.8,
    is_flash_sale BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    unpublished_by_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  orders: `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    total_amount NUMERIC NOT NULL,
    shipping_fee NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    payment_status TEXT DEFAULT 'Unpaid',
    payment_method TEXT,
    courier_name TEXT,
    tracking_number TEXT,
    billing_details JSONB,
    shipping_details JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  order_items: `CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT,
    quantity INTEGER DEFAULT 1,
    price NUMERIC NOT NULL,
    variant_info JSONB
  );`,

  customers: `CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  coupons: `CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT DEFAULT 'percentage',
    discount_value NUMERIC NOT NULL,
    min_spend NUMERIC DEFAULT 0,
    expiry_date TIMESTAMPTZ,
    status BOOLEAN DEFAULT true
  );`,

  banners: `CREATE TABLE IF NOT EXISTS banners (
    id TEXT PRIMARY KEY,
    title TEXT,
    subtitle TEXT,
    badge TEXT,
    image TEXT,
    bg_color TEXT,
    type TEXT DEFAULT 'main',
    status BOOLEAN DEFAULT true,
    serial INTEGER,
    category_slug TEXT
  );`,

  sliders: `CREATE TABLE IF NOT EXISTS sliders (
    id TEXT PRIMARY KEY,
    title TEXT,
    image TEXT NOT NULL,
    link TEXT,
    status BOOLEAN DEFAULT true,
    serial_number INTEGER DEFAULT 0
  );`,

  reviews: `CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    product_name TEXT,
    customer_name TEXT,
    text TEXT,
    rating INTEGER,
    images JSONB,
    status TEXT DEFAULT 'Approved',
    verified BOOLEAN DEFAULT false,
    date TEXT
  );`,

  inventory: `CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    current_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  settings: `CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  company_settings: `CREATE TABLE IF NOT EXISTS company_settings (
    id TEXT PRIMARY KEY,
    company_name TEXT,
    site_title TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    currency TEXT DEFAULT 'BDT',
    currency_symbol TEXT DEFAULT '৳',
    facebook_url TEXT,
    instagram_url TEXT,
    youtube_url TEXT,
    meta_description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  messages: `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    customer_name TEXT,
    customer_email TEXT,
    message TEXT,
    reply_by TEXT,
    timestamp TEXT,
    type TEXT DEFAULT 'text',
    matched_source TEXT
  );`
};

export const COMBINED_SUPABASE_SQL = Object.values(SUPABASE_TABLE_DEFINITIONS).join('\n\n');
