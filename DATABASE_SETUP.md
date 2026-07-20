# Database Setup Guide

## Recommended: Supabase (Best for Next.js)

### Why Supabase?
- ✅ PostgreSQL database (reliable, SQL-based)
- ✅ Built-in file storage for images
- ✅ Free tier with generous limits
- ✅ Easy Next.js integration
- ✅ REST API auto-generated
- ✅ Real-time capabilities if needed

### Setup Steps:

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up for free
   - Create a new project

2. **Set Up Database Table**
   ```sql
   -- Run this SQL in Supabase SQL Editor
   CREATE TABLE catalog_items (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     image_url TEXT NOT NULL,
     seller_name TEXT NOT NULL,
     seller_badge TEXT CHECK (seller_badge IN ('Pro', 'Verified', NULL)),
     price DECIMAL(10, 2) NOT NULL,
     instagram_url TEXT NOT NULL,
     category TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create index for faster searches
   CREATE INDEX idx_catalog_items_category ON catalog_items(category);
   CREATE INDEX idx_catalog_items_price ON catalog_items(price);
   CREATE INDEX idx_catalog_items_name ON catalog_items USING gin(to_tsvector('english', name));
   ```

3. **Set Up Storage Bucket for Images**
   - Go to Storage in Supabase dashboard
   - Create a new bucket called "catalog-images"
   - Set it to public

4. **Get API Keys**
   - Go to Project Settings > API
   - Copy your:
     - Project URL
     - anon/public key (safe for client-side)

5. **Install Supabase Client**
   ```bash
   npm install @supabase/supabase-js
   ```

6. **Environment Variables**
   Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## Alternative: MongoDB Atlas + Cloudinary

### Setup Steps:

1. **MongoDB Atlas**
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string

2. **Cloudinary (for images)**
   - Sign up at https://cloudinary.com
   - Get API keys from dashboard
   - Free tier: 25GB storage

3. **Install Packages**
   ```bash
   npm install mongodb cloudinary
   ```

---

## Database Schema for Catalog Items

Regardless of which database you choose, here's the structure you need:

```typescript
interface CatalogItem {
  id: string              // UUID or MongoDB ObjectId
  name: string            // Item name
  image: string           // URL to image (from storage)
  sellerName: string      // Seller's name
  sellerBadge: 'Pro' | 'Verified' | null
  price: number           // Price in BBD
  instagramUrl: string    // Instagram profile URL
  category?: string       // Optional: Clothing, Shoes, etc.
  createdAt: Date
  updatedAt: Date
}
```

---

## Image Storage Best Practices

**Don't store images in the database directly!** Instead:

1. **Upload to storage service** (Supabase Storage, Cloudinary, AWS S3)
2. **Store the URL** in your database
3. **Benefits:**
   - Faster page loads
   - Better image optimization
   - Lower database costs
   - Easy CDN delivery

---

## Next Steps

Once you choose a database solution, I can help you:
1. Set up the database connection
2. Create API routes to fetch/insert data
3. Set up image upload functionality
4. Migrate from mock data to real database

Which option would you like to proceed with?
