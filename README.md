# IMVU Catalog Clone

A Next.js (App Router) catalog page that clones the IMVU catalog UI.

## Features

- **Dark Header Filter Bar** with:
  - Category dropdown
  - All Prices dropdown
  - Sort dropdown (Best Match, Price, Name)
  - Search input
  - Pagination with "Page X / N" and number buttons

- **4-Column Responsive Grid** of item cards with:
  - Item image
  - Item name
  - Seller name with badge pills (Pro/Verified)
  - Price in BBD
  - Heart icon for favorites
  - Try (gray) and Buy (yellow) buttons

- **URL Query Parameters**: All filters, search, and pagination are reflected in the URL
- **API Integration**: Fetches data from `GET /api/catalog`
- **Loading States**: Skeleton loaders while fetching
- **Empty State**: User-friendly message when no items are found
- **Pagination**: Full pagination support with page numbers

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and navigate to `/catalog`.

## Project Structure

- `app/catalog/page.tsx` - Main catalog page
- `app/api/catalog/route.ts` - API endpoint for catalog data
- `components/FilterBar.tsx` - Filter bar component
- `components/ItemCard.tsx` - Item card component
- `components/Pagination.tsx` - Pagination component
- `components/ItemCardSkeleton.tsx` - Loading skeleton component
