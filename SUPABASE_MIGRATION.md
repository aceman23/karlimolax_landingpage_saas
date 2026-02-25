# Supabase Migration Guide

## Migration Status: IN PROGRESS

Your KarLimoLAX application has been partially migrated from MongoDB to Supabase. The build now compiles successfully, but additional work is needed for full functionality.

## What's Been Completed

### 1. Database Setup ✅
- Supabase database is provisioned and ready
- Database schema exists with all necessary tables:
  - `profiles` - User profiles
  - `customers` - Customer information
  - `vehicles` - Fleet vehicles
  - `bookings` - Ride bookings
  - `service_packages` - Service packages
  - `driver_documents` - Driver documents
  - `driver_ratings` - Driver ratings
  - `driver_availability` - Driver schedules
  - `payment_records` - Payment history
  - `sms_logs` - SMS notification logs
  - `email_notifications` - Email templates
  - `admin_settings` - System settings

### 2. Supabase Client Libraries ✅
- Created `/server/lib/supabase.ts` - Server-side Supabase client
- Created `/src/lib/supabase.ts` - Frontend Supabase client
- Installed `@supabase/supabase-js` package

### 3. Environment Configuration ✅
- Updated `.env` with Supabase credentials
- Removed MongoDB connection string
- Added both VITE_ and NEXT_PUBLIC_ prefixed environment variables

### 4. Server Updates ✅
- Removed MongoDB connection from `server/index.ts`
- Server can now start without MongoDB dependency

### 5. Build System ✅
- Application builds successfully
- No compilation errors

## What Needs To Be Done

### CRITICAL: Add Supabase Service Role Key

You need to add the Supabase Service Role Key to your `.env` file:

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/vkazivsqoetxrcdnxoop
2. Navigate to Settings → API
3. Copy the `service_role` key (NOT the anon key)
4. Add it to `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### Backend Migration Tasks

#### 1. Update Authentication Routes (`server/routes/auth.ts`)
Currently uses MongoDB/JWT. Needs to be updated to use Supabase Auth:
- Replace MongoDB user queries with Supabase Auth
- Use `supabase.auth.signUp()` for registration
- Use `supabase.auth.signInWithPassword()` for login
- Use `supabase.auth.signOut()` for logout
- Store user profile in `profiles` table after signup

#### 2. Update API Routes (`server/routes/api.ts`)
Replace all MongoDB queries with Supabase queries:
- Vehicles CRUD operations
- Bookings CRUD operations
- Service packages CRUD operations
- Customer data operations

Example migration pattern:
```typescript
// Before (MongoDB)
const vehicles = await Vehicle.find({ status: 'active' });

// After (Supabase)
const { data: vehicles, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('status', 'active');
```

#### 3. Update Admin Routes (`server/routes/admin.ts`)
- Migrate all admin operations to use Supabase
- Update driver management queries
- Update booking management queries
- Update settings management queries

### Frontend Migration Tasks

#### 1. Update Services Layer
Update all service files in `/src/services/`:
- `auth.ts` - Update to use Supabase Auth
- `booking.ts` - Use Supabase queries
- `customer.ts` - Use Supabase queries
- `database.ts` - Replace MongoDB operations

#### 2. Update AuthContext (`src/context/AuthContext.tsx`)
Option A: Keep using backend API (current approach)
- Update backend auth routes to use Supabase
- No frontend changes needed

Option B: Use Supabase Auth directly
- Replace API calls with Supabase Auth methods
- Use `supabase.auth.onAuthStateChange()` for session management
- Store user profile data separately

#### 3. Update Admin Components
Admin pages in `/src/pages/admin/` need to:
- Use Supabase queries instead of API calls to MongoDB backend
- Update real-time subscriptions if needed

### Data Migration

If you have existing data in MongoDB, you need to:

1. Export data from MongoDB
2. Transform data format (MongoDB ObjectId → UUID)
3. Import into Supabase tables

### Testing

After migration:
1. Test user registration and login
2. Test booking creation
3. Test admin dashboard
4. Test driver features
5. Test payment processing

## Recommended Migration Approach

### Phase 1: Authentication (High Priority)
1. Add Supabase Service Role Key to `.env`
2. Update `server/routes/auth.ts` to use Supabase Auth
3. Test login/registration flows

### Phase 2: Core Functionality
1. Update booking system to use Supabase
2. Update vehicle management
3. Update service packages

### Phase 3: Admin Features
1. Update admin dashboard
2. Update driver management
3. Update settings management

### Phase 4: Cleanup
1. Remove MongoDB dependencies from `package.json`
2. Delete MongoDB-related files
3. Remove unused schema files

## Benefits of Supabase Migration

1. **No Database Server** - Fully managed PostgreSQL
2. **Built-in Authentication** - Supabase Auth handles sessions, password reset, etc.
3. **Row Level Security** - Database-level security policies
4. **Real-time Subscriptions** - Listen to database changes
5. **Auto-generated APIs** - REST and GraphQL APIs
6. **Better Scaling** - Horizontal scaling built-in
7. **Backups** - Automatic daily backups

## Current Limitations

Until migration is complete:
- User authentication won't work (backend still expects MongoDB)
- Booking system won't work (API routes use MongoDB)
- Admin features won't work (queries expect MongoDB)

## Getting Help

- Supabase Documentation: https://supabase.com/docs
- Supabase Dashboard: https://supabase.com/dashboard/project/vkazivsqoetxrcdnxoop
- JavaScript Client Docs: https://supabase.com/docs/reference/javascript

## Next Steps

Run these commands to start development:

```bash
# Add your Supabase Service Role Key to .env first!

# Start the development server
npm run dev

# The site will be available at http://localhost:5173
```

Note: The site will load but most features won't work until the backend routes are migrated to use Supabase.
