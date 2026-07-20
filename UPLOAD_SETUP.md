# Image Upload Setup Guide

## Prerequisites

1. ✅ Supabase client installed (`@supabase/supabase-js`)
2. ✅ `.env.local` file created with your Supabase credentials
3. ⚠️ Supabase storage bucket configured (see below)

## Setup Steps

### 1. Create Supabase Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Create a bucket named: **`catalog-images`**
5. Set it to **Public** (so images can be accessed via URL)
   - Or configure Row Level Security (RLS) policies if you need private storage

### 2. Verify Environment Variables

Make sure your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_BUCKET=catalog-images
```

### 3. Test the Upload

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/upload`

3. Select an image file (JPEG, PNG, WebP, or GIF)

4. Click "Upload Image"

5. Copy the returned URL to use in your catalog items

## Features

- ✅ **File Validation**: Only image files allowed (JPEG, PNG, WebP, GIF)
- ✅ **Size Limit**: Maximum 10MB per file
- ✅ **Unique Filenames**: Prevents filename conflicts
- ✅ **Preview**: See image before uploading
- ✅ **Public URLs**: Get direct URLs for use in catalog
- ✅ **Error Handling**: Clear error messages

## File Structure

```
lib/supabase.ts          # Supabase client configuration
app/api/upload/route.ts  # Upload API endpoint
app/upload/page.tsx      # Upload UI page
```

## Storage Bucket Structure

Images are stored in Supabase Storage at:
```
catalog-images/
  ├── catalog-items/
  │   ├── 1234567890-abc123def456.jpg
  │   ├── 1234567891-xyz789ghi012.png
  │   └── ...
```

## Using Uploaded Images

Once you upload an image, you'll get a URL like:
```
https://[your-project].supabase.co/storage/v1/object/public/catalog-images/catalog-items/1234567890-abc123def456.jpg
```

Use this URL as the `image` field when creating catalog items in your database.

## Troubleshooting

### "Upload failed: bucket not found"
- Make sure the bucket `catalog-images` exists in Supabase Storage
- Check that the bucket name matches exactly (case-sensitive)

### "Upload failed: new row violates row-level security policy"
- Make the bucket public in Supabase Storage settings
- Or configure RLS policies to allow uploads

### Environment variables not working
- Make sure `.env.local` is in the project root
- Restart the development server after adding/updating `.env.local`
- Verify variable names start with `NEXT_PUBLIC_` for client-side access

## Next Steps

After successfully uploading images, you can:
1. Store the URLs in your database with catalog items
2. Use the URLs in the catalog display
3. Create an admin interface to manage items with images
