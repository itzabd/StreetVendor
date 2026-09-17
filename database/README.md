# Database Schema & Migrations

This directory contains the database definition and migration scripts for the **StreetVendor BD** platform (Supabase PostgreSQL).

## Structure

```
database/
├── schema.sql                 # Base canonical database schema (tables, triggers, RLS, functions)
└── migrations/                # Incremental migration scripts applied sequentially
    ├── migration_add_admin_notes.sql        # Adds admin notes to applications
    ├── migration_add_application_dates.sql  # Adds submission/approval timestamps
    ├── migration_flatten_hierarchy.sql      # Flattens zone-spot hierarchy
    └── migration_permissions_spot.sql       # Adds spot-level permission controls
```

## Setup Instructions

1. **Initial Provisioning**: Run `schema.sql` inside the Supabase SQL Editor.
2. **Incremental Updates**: Apply files in `migrations/` in chronological order if updating an existing deployment.
