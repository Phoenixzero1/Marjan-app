CREATE INDEX IF NOT EXISTS product_fts_idx ON "Product"
  USING gin(to_tsvector('simple', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(sku, '')));

CREATE INDEX IF NOT EXISTS product_name_trgm_idx ON "Product" USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS blog_fts_idx ON "BlogPost"
  USING gin(to_tsvector('simple', title || ' ' || COALESCE(excerpt, '') || ' ' || COALESCE(content, '')));
