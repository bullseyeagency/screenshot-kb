# Screenshot KB

A dark, mobile-friendly gallery app for uploading screenshots, storing them in Supabase, and enriching them with Claude Vision — OCR, analysis, summary, categories, tags, topics, key entities, and action items.

Port: **3025**

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS + Bullseye Design System
- Supabase (PostgreSQL + Storage)
- Anthropic Claude Vision (`claude-sonnet-4-6`)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.local.example` to `.env.local` and fill in values:

```bash
cp .env.local.example .env.local
```

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Supabase: Create the database table

Run this SQL in the Supabase SQL editor:

```sql
create table screenshots (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  storage_path text not null,
  url text not null,
  file_size integer,
  mime_type text,
  uploaded_at timestamptz default now(),
  status text default 'inbox' check (status in ('inbox','analyzing','analyzed','archived')),
  ocr text,
  analysis text,
  summary text,
  categories text[],
  tags text[],
  topics text[],
  content_type text,
  key_entities text[],
  action_items text[],
  source_hint text,
  created_at timestamptz default now()
);
```

### 4. Supabase: Create the Storage bucket

In Supabase Dashboard > Storage > New bucket:

- Name: `screenshots`
- Public: **enabled**

### 5. Run

```bash
npm run dev
```

App runs at [http://localhost:3025](http://localhost:3025).

## Features

- **Gallery view** with filter tabs: All / Inbox / Analyzed
- **Multi-select** with floating action bar for batch analyze or delete
- **Upload modal** — tap Upload, drag-and-drop or pick from photo library
- **Detail panel** — tap any card to see full image, summary, OCR, analysis, tags, entities, action items
- **Persistent storage** — images stored in Supabase Storage, metadata in PostgreSQL
- **Live polling** — auto-refreshes every 3s while any screenshot is analyzing

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/upload` | Upload images, create DB records |
| GET | `/api/screenshots` | List all screenshots (supports `?status=inbox`) |
| DELETE | `/api/screenshots/[id]` | Delete screenshot from DB and storage |
| POST | `/api/analyze` | Run Claude Vision analysis on a screenshot by ID |
