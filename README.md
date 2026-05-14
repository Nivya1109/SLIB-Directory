# SLIB Directory and Finder

A graduate-level capstone project — a full-stack software library discovery and comparison platform that helps developers find, explore, and compare open-source libraries across the JavaScript (NPM), Python (PyPI), and Apache open-source ecosystem.

## Overview

SLIB Directory aggregates over 470 software libraries from multiple public sources and provides intelligent search, AI-powered recommendations, side-by-side comparison, and a data quality dashboard. It is designed to serve as a structured alternative to searching scattered documentation sites or package registries directly.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL (Supabase) |
| Search | Typesense (primary), PostgreSQL full-text + pg_trgm (fallback) |
| AI | Groq API (llama-3.1-8b-instant) |
| Auth | NextAuth.js |
| Monitoring | Sentry |
| Testing | Vitest (unit + integration) |

## Features

- **Intelligent Search** — Typo-tolerant, prefix-aware search powered by Typesense with synonym expansion and intent detection. Automatically falls back to PostgreSQL full-text search when Typesense is unavailable.
- **AI Recommendations** — Describe what you want to build and the system recommends matching libraries from the database using Groq AI.
- **AI Comparison Summary** — Select 2–4 libraries and get a concise AI-generated comparison covering tradeoffs, best use cases, and beginner vs. enterprise suitability.
- **AI Explain** — Get a skill-level-tailored explanation of any library (beginner / intermediate / advanced).
- **Library Detail Pages** — Full metadata including description, categories, platforms, languages, versions, pricing, and example code.
- **Side-by-Side Compare** — Structured feature comparison across selected libraries.
- **Statistics Dashboard** — Visual charts showing distribution by category, language, platform, and organization.
- **ETL Data Pipeline** — Automated crawlers fetch and upsert libraries from NPM, PyPI, and Apache Software Foundation APIs.
- **Admin Dashboard** — Trigger incremental crawl runs, monitor data quality, and track missing metadata fields.
- **Support System** — Built-in user support request form with email delivery.

## Data Sources

| Source | Libraries | Method |
|--------|-----------|--------|
| NPM Registry | ~160 | REST API + discovery search |
| PyPI | ~190 | REST API + top-downloads list |
| Apache Software Foundation | ~100 | projects.apache.org JSON API |
| Curated Seed Data | 21 | Hand-authored high-quality entries |
| **Total** | **~471** | |

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL database (or Supabase project)
- Typesense instance (local or Typesense Cloud)
- Groq API key (for AI features)

### Installation

1. **Clone the repository and install dependencies:**

```bash
git clone https://github.com/Nivya1109/SLIB-Directory.git
cd sip-directory
pnpm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DATABASE_URL=           # PostgreSQL connection string
TYPESENSE_HOST=         # Typesense host
TYPESENSE_API_KEY=      # Typesense admin API key
GROQ_API_KEY=           # Groq API key
NEXTAUTH_SECRET=        # Random secret for NextAuth
NEXTAUTH_URL=           # App URL (http://localhost:3000 for dev)
```

3. **Initialize the database:**

```bash
pnpm db:migrate
pnpm db:seed
```

4. **Run the ETL pipeline to populate library data:**

```bash
pnpm crawl
```

5. **Start the development server:**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
sip-directory/
├── app/
│   ├── api/
│   │   ├── ai/               # AI routes: recommend, explain, compare-summary
│   │   ├── admin/            # Admin routes: crawler trigger, data quality
│   │   ├── sips/             # Library search and detail endpoints
│   │   ├── stats/            # Statistics aggregation
│   │   └── support/          # Support request handling
│   ├── search/               # Search results page
│   ├── sip/[slug]/           # Library detail page
│   ├── compare/              # Side-by-side comparison page
│   ├── stats/                # Statistics dashboard
│   ├── recommend/            # AI recommendation page
│   └── admin/                # Admin dashboard
├── components/               # Shared React components
│   └── ui/                   # shadcn/ui primitives
├── lib/
│   ├── searchService.ts      # Search orchestration (Typesense + Postgres fallback)
│   ├── search/               # Query expansion, synonym maps, use-case detection
│   ├── auth.ts               # NextAuth configuration
│   ├── prisma.ts             # Prisma client singleton
│   └── email.ts              # Email delivery
├── etl/
│   ├── crawlers/             # NPM, PyPI, Apache crawlers
│   ├── sources/              # Additional data source fetchers
│   └── pipeline.ts           # ETL orchestration entry point
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Curated seed data
└── __tests__/
    ├── unit/                 # Unit tests (Vitest)
    └── integration/          # Integration tests (Vitest, mocked DB)
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run unit and integration tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed database with curated entries |
| `pnpm crawl` | Run all ETL crawlers (npm + PyPI + Apache) |
| `pnpm crawl:npm` | Run NPM crawler only |
| `pnpm crawl:pypi` | Run PyPI crawler only |
| `pnpm crawl:apache` | Run Apache crawler only |

## Deployment

The application is deployed on **Render** with a **Supabase** PostgreSQL backend and **Typesense Cloud** for search.

Live URL: https://slib-directory.onrender.com

## Testing

```bash
# Run all unit and integration tests
pnpm test

# Run with coverage
pnpm test:coverage
```

Tests cover ETL utility functions, search query expansion logic, ETL data validation, and the search service response contract. See [`__tests__/MANUAL_TESTING.md`](__tests__/MANUAL_TESTING.md) for the manual testing checklist used during beta.

## Academic Context

This project was developed as a graduate capstone at the **University of Maryland, Baltimore County (UMBC)**. It evolved from an initial SIP (Software-Intensive Products) directory concept to a focused software library discovery platform, incorporating feedback across Alpha and Beta review stages.
