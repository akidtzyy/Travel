# Booking Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, feature-rich Booking Management system in the admin panel with structured database storage, landing page dual-writes, filtering/searching, status updates, and a printable invoice generator.

**Architecture:** Create a new `bookings` table in Supabase. Update frontend booking forms to write to both the `customers` (compatibility) and `bookings` tables. Add an admin page `/admin/bookings` for managing and printing invoices, and connect the admin dashboard stats to the new table.

**Tech Stack:** React, TypeScript, Vite, Supabase JS, Tailwind CSS, Lucide Icons, Framer Motion

## Global Constraints

- Code must build successfully using `npm run build` without any compilation errors.
- Ensure all Supabase query operations handle potential errors gracefully and report them via console or Toast UI.
- All new interactive elements must have clear classes/IDs for responsiveness and ease of accessibility.

---

### Task 1: Database Migration Setup for Bookings

**Files:**
- Create: `src/lib/supabase-bookings.sql`

**Interfaces:**
- Consumes: Supabase database schema
- Produces: `bookings` table with columns, indexes, auto-updated timestamps, and RLS policies

- [ ] **Step 1: Write SQL migration script**

  Create `src/lib/supabase-bookings.sql` with the following content to set up the `bookings` table and its policies:
  ```sql
  -- Create bookings table if not exists
  CREATE TABLE IF NOT EXISTS public.bookings (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    booking_type TEXT NOT NULL CHECK (booking_type IN ('package', 'car')),
    item_name TEXT NOT NULL,
    date DATE NOT NULL,
    duration TEXT NOT NULL,
    notes TEXT DEFAULT '',
    total_price TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' 
      CHECK (status IN ('pending', 'confirmed', 'paid', 'completed', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' 
      CHECK (payment_status IN ('unpaid', 'paid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Enable RLS
  ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

  -- Create insert policy for public
  DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
  CREATE POLICY "Public can insert bookings" ON public.bookings
    FOR INSERT TO anon, authenticated WITH CHECK (true);

  -- Create full access policy for admin
  DROP POLICY IF EXISTS "Admin full access to bookings" ON public.bookings;
  CREATE POLICY "Admin full access to bookings" ON public.bookings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- Create updated_at trigger
  DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
  CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  ```

- [ ] **Step 2: Commit SQL migration file**

  Run:
  ```bash
  git add src/lib/supabase-bookings.sql
  git commit -m "migration: add bookings schema and RLS policies"
  ```

---

### Task 2: Language Translations for Booking Management

**Files:**
- Modify: `src/lib/i18n.ts`

**Interfaces:**
- Consumes: Translation catalog
- Produces: New translation keys for booking management in Indonesian (`id`) and English (`en`)

- [ ] **Step 1: Add translation keys in i18n.ts**

  Locate the `'id'` block and add the following keys. Place them near other admin-related keys:
  ```typescript
  bookingManagement: 'Kelola Booking',
  bookingId: 'ID Booking',
  paymentStatus: 'Status Pembayaran',
  unpaid: 'Belum Lunas',
  paid: 'Lunas',
  pending: 'Tertunda',
  confirmed: 'Dikonfirmasi',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  invoice: 'Faktur / Invoice',
  printInvoice: 'Cetak Invoice',
  confirmBooking: 'Konfirmasi Booking',
  cancelBooking: 'Batalkan Booking',
  bookingDetails: 'Detail Booking',
  bookingSaved: 'Data booking berhasil diperbarui',
  bookingDeleted: 'Booking berhasil dihapus',
  bookingType: 'Tipe Booking',
  carRental: 'Sewa Mobil',
  tourPackage: 'Paket Wisata',
  all: 'Semua',
  pax: 'Orang',
  days: 'Hari',
  ```

  Locate the `'en'` block and add the corresponding English keys:
  ```typescript
  bookingManagement: 'Booking Management',
  bookingId: 'Booking ID',
  paymentStatus: 'Payment Status',
  unpaid: 'Unpaid',
  paid: 'Paid',
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  invoice: 'Invoice',
  printInvoice: 'Print Invoice',
  confirmBooking: 'Confirm Booking',
  cancelBooking: 'Cancel Booking',
  bookingDetails: 'Booking Details',
  bookingSaved: 'Booking data successfully updated',
  bookingDeleted: 'Booking successfully deleted',
  bookingType: 'Booking Type',
  carRental: 'Car Rental',
  tourPackage: 'Tour Package',
  all: 'All',
  pax: 'Pax',
  days: 'Days',
  ```

- [ ] **Step 2: Commit i18n changes**

  Run:
  ```bash
  git add src/lib/i18n.ts
  git commit -m "i18n: add translations for booking management"
  ```

---

### Task 3: Admin Layout & Routing Navigation

**Files:**
- Modify: `src/components/admin/AdminLayout.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `AdminLayoutProps`, `App` route declarations
- Produces: Navigation item linked to `/admin/bookings` using the `CalendarCheck` icon, registered route path in `App.tsx` pointing to the new page component

- [ ] **Step 1: Add Sidebar Menu Item in AdminLayout.tsx**

  Open `src/components/admin/AdminLayout.tsx` and modify the lucide-react imports:
  ```typescript
  import {
    LayoutDashboard, Package, Users, LogOut, Menu, X,
    Palmtree, ChevronRight, Globe, CalendarCheck
  } from 'lucide-react';
  ```

  Then insert the menu item:
  ```typescript
    const menuItems = [
      { path: '/admin', icon: LayoutDashboard, label: t('dashboard') },
      { path: '/admin/bookings', icon: CalendarCheck, label: t('bookingManagement') },
      { path: '/admin/stock', icon: Package, label: t('stockManagement') },
      { path: '/admin/customers', icon: Users, label: t('customerDatabase') },
    ];
  ```

- [ ] **Step 2: Register Router Route in App.tsx**

  Open `src/App.tsx` and import the (to-be-created) `BookingManagement` page:
  ```typescript
  import BookingManagement from './pages/admin/BookingManagement';
  ```

  Under the Protected Admin Routes segment, add the route path:
  ```typescript
              {/* Protected Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/bookings" element={<ProtectedRoute><BookingManagement /></ProtectedRoute>} />
              <Route path="/admin/stock" element={<ProtectedRoute><StockManagement /></ProtectedRoute>} />
              <Route path="/admin/customers" element={<ProtectedRoute><CustomerDatabase /></ProtectedRoute>} />
  ```

- [ ] **Step 3: Commit Navigation and Route changes**

  Run:
  ```bash
  git add src/components/admin/AdminLayout.tsx src/App.tsx
  git commit -m "navigation: connect bookings route and sidebar item"
  ```

---

### Task 4: Integrate Bookings (Dual-Write) in Public Landing Pages

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/CarRental.tsx`

**Interfaces:**
- Consumes: Supabase client
- Produces: Simultaneous insertions of booking data into `customers` and `bookings` tables on submit

- [ ] **Step 1: Update Home.tsx booking submit**

  Open `src/pages/Home.tsx` and find the `handleBooking` method.
  Inside the `try` block, add the database insertion to the `bookings` table alongside the existing `customers` insert:
  ```typescript
      try {
        setBookingLoading(true);
        const notesWithDetails = `Tipe: ${bookingForm.booking_type === 'package' ? 'Paket Wisata' : 'Sewa Mobil'}\nItem: ${bookingForm.item_name}\nJumlah/Durasi: ${bookingForm.duration}\nTanggal: ${bookingForm.date}\nHarga: ${bookingForm.total_price}\nCatatan: ${bookingForm.notes}`;
        
        // Original Customer insert
        const { error: custErr } = await supabase.from('customers').insert({
          full_name: bookingForm.name,
          phone: bookingForm.phone.replace(/\D/g, ''),
          email: bookingForm.email,
          booking_status: 'booked',
          notes: notesWithDetails
        });
        if (custErr) throw custErr;

        // NEW Bookings insert
        const { error: bookingErr } = await supabase.from('bookings').insert({
          name: bookingForm.name,
          email: bookingForm.email,
          phone: bookingForm.phone.replace(/\D/g, ''),
          booking_type: bookingForm.booking_type,
          item_name: bookingForm.item_name,
          date: bookingForm.date,
          duration: bookingForm.duration,
          notes: bookingForm.notes,
          total_price: bookingForm.total_price,
          status: 'pending',
          payment_status: 'unpaid'
        });
        if (bookingErr) throw bookingErr;

        setBookingSuccess(true);
      }
  ```

- [ ] **Step 2: Update CarRental.tsx booking submit**

  Open `src/pages/CarRental.tsx` and find the `handleBooking` method.
  Inside the `try` block, add the database insertion to the `bookings` table:
  ```typescript
      try {
        setBookingLoading(true);
        const notesWithDetails = `Tipe: Sewa Mobil\nKendaraan: ${bookingForm.item_name}\nDurasi: ${bookingForm.duration}\nTanggal Sewa: ${bookingForm.date}\nHarga: ${bookingForm.total_price}\nCatatan: ${bookingForm.notes}`;
        
        // Original Customer insert
        const { error: custErr } = await supabase.from('customers').insert({
          full_name: bookingForm.name,
          phone: bookingForm.phone.replace(/\D/g, ''),
          email: bookingForm.email,
          booking_status: 'booked',
          notes: notesWithDetails
        });
        if (custErr) throw custErr;

        // NEW Bookings insert
        const { error: bookingErr } = await supabase.from('bookings').insert({
          name: bookingForm.name,
          email: bookingForm.email,
          phone: bookingForm.phone.replace(/\D/g, ''),
          booking_type: 'car',
          item_name: bookingForm.item_name,
          date: bookingForm.date,
          duration: bookingForm.duration,
          notes: bookingForm.notes,
          total_price: bookingForm.total_price,
          status: 'pending',
          payment_status: 'unpaid'
        });
        if (bookingErr) throw bookingErr;

        setBookingSuccess(true);
      }
  ```

- [ ] **Step 3: Commit landing page form changes**

  Run:
  ```bash
  git add src/pages/Home.tsx src/pages/CarRental.tsx
  git commit -m "feat: dual-write booking details to bookings table"
  ```

---

### Task 5: Implement `BookingManagement.tsx` Core Features

**Files:**
- Create: `src/pages/admin/BookingManagement.tsx`

**Interfaces:**
- Consumes: Supabase database `bookings` table, I18n Context translation functions
- Produces: Beautiful, premium admin interface to list, search, filter, edit, and update booking records

- [ ] **Step 1: Create the BookingManagement file with imports and TS interfaces**

  Write the file header, interfaces, and state declarations inside `src/pages/admin/BookingManagement.tsx`:
  ```typescript
  import { useState, useEffect } from 'react';
  import { motion, AnimatePresence } from 'framer-motion';
  import {
    CalendarCheck, Search, Filter, Calendar, Mail, Phone,
    User, FileText, Check, X, AlertCircle, Eye, Trash2, Printer,
    DollarSign, ChevronLeft, ChevronRight, RefreshCw, Palmtree, Car
  } from 'lucide-react';
  import { useI18n } from '../../lib/I18nContext';
  import supabase from '../../lib/supabase';

  interface Booking {
    id: number;
    name: string;
    email: string;
    phone: string;
    booking_type: 'package' | 'car';
    item_name: string;
    date: string;
    duration: string;
    notes: string;
    total_price: string;
    status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled';
    payment_status: 'unpaid' | 'paid';
    created_at: string;
  }
  ```

- [ ] **Step 2: Write state management, data loading, and operations**

  Implement loading functions, status quick updates, and deleting actions:
  ```typescript
  export default function BookingManagement() {
    const { t } = useI18n();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const perPage = 10;

    useEffect(() => {
      loadBookings();
    }, []);

    const loadBookings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data) setBookings(data);
      } catch (err) {
        console.error('Error loading bookings:', err);
        showToast('error', t('errorOccurred'));
      } finally {
        setLoading(false);
      }
    };

    const showToast = (type: 'success' | 'error', message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 3000);
    };

    const updateStatus = async (id: number, field: 'status' | 'payment_status', value: string) => {
      try {
        // Optimistic UI update
        setBookings(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
        if (selectedBooking && selectedBooking.id === id) {
          setSelectedBooking(prev => prev ? { ...prev, [field]: value as any } : null);
        }

        const updates: any = { [field]: value };
        // If booking status is updated to Paid, auto update payment_status to Paid
        if (field === 'status' && value === 'paid') {
          updates.payment_status = 'paid';
          setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'paid', payment_status: 'paid' } : b));
          if (selectedBooking && selectedBooking.id === id) {
            setSelectedBooking(prev => prev ? { ...prev, status: 'paid', payment_status: 'paid' } : null);
          }
        }

        const { error } = await supabase.from('bookings').update(updates).eq('id', id);
        if (error) throw error;

        showToast('success', t('bookingSaved'));
      } catch (err) {
        console.error('Error updating status:', err);
        showToast('error', t('errorOccurred'));
        loadBookings(); // Rollback on error
      }
    };

    const deleteBooking = async (id: number) => {
      try {
        const { error } = await supabase.from('bookings').delete().eq('id', id);
        if (error) throw error;
        showToast('success', t('bookingDeleted'));
        loadBookings();
      } catch (err) {
        console.error('Error deleting booking:', err);
        showToast('error', t('errorOccurred'));
      }
      setDeleteConfirm(null);
    };
  ```

- [ ] **Step 3: Add stats, filters logic, and tables render markup**

  Write UI elements including stats counters, filtering inputs, standard Tailwind table layouts, paginations, and list items. Keep designs highly polished using framer motion.

- [ ] **Step 4: Build Detail Modal with full info and editing options**

  Build a sidebar modal overlay or center modal with all the booking info detailed and forms for status modification.

- [ ] **Step 5: Commit core BookingManagement.tsx file**

  Run:
  ```bash
  git add src/pages/admin/BookingManagement.tsx
  git commit -m "feat: implement booking management listing and operations"
  ```

---

### Task 6: Invoice Print Layout Integration

**Files:**
- Modify: `src/pages/admin/BookingManagement.tsx`

**Interfaces:**
- Consumes: `selectedBooking`
- Produces: Styled print invoice modal and handler using CSS media query `@media print` print styles to trigger a clean receipt paper print layout

- [ ] **Step 1: Add Invoice Modal markup and print trigger**

  Create a print-friendly invoice component inside `src/pages/admin/BookingManagement.tsx`. It should include:
  *   Company brand logo and details (ClickAndGo Travel & Rental)
  *   Invoice metadata (Invoice #, Date, Bill To, Payment Status)
  *   Itemized billing list (Item Name, booking type, pax/duration, Total Price)
  *   Call-to-action print trigger function using `window.print()`
  *   Apply Tailwind CSS print modifiers (e.g. `print:hidden`, `print:p-0`, `print:shadow-none`, etc.) to hide admin layouts, sidebars, buttons, and display only the clean print invoice template.

- [ ] **Step 2: Commit Invoice features**

  Run:
  ```bash
  git add src/pages/admin/BookingManagement.tsx
  git commit -m "feat: add invoice print modal with window.print support"
  ```

---

### Task 7: Integrate Dashboard Statistics

**Files:**
- Modify: `src/pages/admin/AdminDashboard.tsx`

**Interfaces:**
- Consumes: Supabase `bookings` table
- Produces: Replaced dashboard counters and recent booking lists reading from `bookings` table

- [ ] **Step 1: Update dashboard load query**

  Change the database queries in `loadDashboardData` inside `src/pages/admin/AdminDashboard.tsx` to read stats and recent entries from `bookings`:
  ```typescript
    const loadDashboardData = async () => {
      try {
        const [pkgRes, carRes, custRes, bookRes] = await Promise.all([
          supabase.from('tour_packages').select('id', { count: 'exact' }),
          supabase.from('car_rentals').select('id', { count: 'exact' }),
          supabase.from('customers').select('id', { count: 'exact' }),
          supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5),
        ]);

        const totalBookingsRes = await supabase.from('bookings').select('id', { count: 'exact' });

        setStats({
          totalPackages: pkgRes.count || 0,
          totalCars: carRes.count || 0,
          totalCustomers: custRes.count || 0,
          totalBookings: totalBookingsRes.count || 0,
        });

        // Set the recent bookings list (mapping fields dynamically)
        if (bookRes.data) {
          // Convert bookings data to RecentCustomer model if needed, or update dashboard UI to map direct booking model. Let's map it safely.
          setRecentCustomers(bookRes.data.map((b: any) => ({
            id: b.id,
            full_name: b.name,
            email: b.email,
            phone: b.phone,
            booking_status: b.status,
            created_at: b.created_at
          })));
        }
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
  ```

- [ ] **Step 2: Commit Dashboard changes**

  Run:
  ```bash
  git add src/pages/admin/AdminDashboard.tsx
  git commit -m "feat: wire admin dashboard stats and lists to bookings table"
  ```

---

### Task 8: Compilation & Build Verification

**Files:**
- None (Build operation only)

**Interfaces:**
- Consumes: Whole codebase compilation checks
- Produces: Correctly built distribution bundle

- [ ] **Step 1: Run compilation check**

  Run: `npm run build`
  Expected: Command succeeds with zero errors.

- [ ] **Step 2: Commit final build confirmation**

  Run:
  ```bash
  git commit --allow-empty -m "build: verify compilation is clean"
  ```
