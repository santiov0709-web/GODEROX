-- =====================================================
-- GODEROX — SQL SCHEMA PARA SUPABASE
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- =====================================================

-- EXTENSIÓN UUID (ya incluida en Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- MIGRACIONES RÁPIDAS PARA BASE DE DATOS SUPABASE
-- ─────────────────────────────────────────────
ALTER TABLE brands ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_section_check;
ALTER TABLE categories ADD CONSTRAINT categories_section_check CHECK (section IN ('hombre', 'mujer', 'perfumes', 'unisex'));
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_section_check;
ALTER TABLE products ADD CONSTRAINT products_section_check CHECK (section IN ('hombre', 'mujer', 'perfumes', 'unisex'));

-- ─────────────────────────────────────────────
-- TABLA: CATEGORIES (Categorías)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  section         TEXT NOT NULL CHECK (section IN ('hombre', 'mujer', 'perfumes', 'unisex')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  display_order   INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABLA: PRODUCTS (Productos)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  brand_id            UUID REFERENCES brands(id) ON DELETE SET NULL,
  section             TEXT CHECK (section IN ('hombre', 'mujer', 'perfumes', 'unisex')),
  category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
  price_usd           NUMERIC(10,2) NOT NULL DEFAULT 0,
  old_price_usd       NUMERIC(10,2),
  discount_percentage INTEGER,
  description         TEXT,
  gsm                 TEXT,
  images              TEXT[] DEFAULT '{}',
  sizes               TEXT[] DEFAULT '{}',
  colors              TEXT[] DEFAULT '{}',
  stock               INTEGER DEFAULT 0,
  tags                TEXT[] DEFAULT '{}',
  is_promo            BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- POLÍTICAS DE SEGURIDAD (Row Level Security)
-- ─────────────────────────────────────────────

-- Habilitar RLS en todas las tablas
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Lectura pública (tienda) — solo registros activos
CREATE POLICY "Public can read active brands" ON brands
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Public can read active categories" ON categories
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Public can read active products" ON products
  FOR SELECT TO anon USING (is_active = true);

-- Admin autenticado puede hacer todo (CRUD completo)
CREATE POLICY "Admin full access to brands" ON brands
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to categories" ON categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to products" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────
-- STORAGE BUCKETS (Ejecutar en: Storage → New Bucket)
-- ─────────────────────────────────────────────
-- 1. Crear bucket "product-images" → Public: YES
-- 2. Crear bucket "brand-logos"    → Public: YES

-- Política de lectura pública para imágenes
-- (Configurar desde: Storage → Policies → product-images / brand-logos)
-- "Allow public read access"

-- ─────────────────────────────────────────────
-- DATOS INICIALES — MARCAS
-- ─────────────────────────────────────────────
INSERT INTO brands (name, subtext, is_active, display_order) VALUES
  ('Clemont',         'Atelier Colombiano',     true, 1),
  ('Labeur',          'Haute Couture Nacional',  true, 2),
  ('Aurum',           'Goldsmith Streetwear',    true, 3),
  ('Y/OUT',           'Urban Minimalism',        true, 4),
  ('Antes Real Ropa', 'Real Colombian Fashion',  true, 5)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- DATOS INICIALES — CATEGORÍAS
-- ─────────────────────────────────────────────
INSERT INTO categories (name, slug, section, is_active, display_order) VALUES
  ('Camisetas',  'camisetas',  'hombre', true, 1),
  ('Buzos',      'buzos',      'hombre', true, 2),
  ('Pantalones', 'pantalones', 'hombre', true, 3),
  ('Sudaderas',  'sudaderas',  'hombre', true, 4),
  ('Gorras',     'gorras',     'hombre', true, 5),
  ('Bodys',      'bodys',      'mujer',  true, 1),
  ('Blusas',     'blusas',     'mujer',  true, 2),
  ('Pantalones', 'pantalones-mujer', 'mujer', true, 3),
  ('Sudaderas',  'sudaderas-mujer',  'mujer', true, 4)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- VERIFICACIÓN
-- ─────────────────────────────────────────────
SELECT 'brands' as tabla, COUNT(*) as registros FROM brands
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products;
