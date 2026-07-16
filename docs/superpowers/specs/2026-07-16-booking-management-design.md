# Booking Management System Design Specification

* **Date:** 2026-07-16
* **Status:** Approved
* **Authors:** Antigravity (AI Pair Programmer) & User

This document outlines the detailed architecture, database schema, data flows, and UI design for the Booking Management system in the admin panel.

---

## 1. Database Schema (`bookings` Table)

A new `bookings` table will be created in Supabase to hold detailed, structured booking records.

### Schema Definition
```sql
CREATE TABLE IF NOT EXISTS public.bookings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('package', 'car')),
  item_name TEXT NOT NULL,
  date DATE NOT NULL,
  duration TEXT NOT NULL, -- "X Pax" for tour packages, "Y Days" for car rentals
  notes TEXT DEFAULT '',
  total_price TEXT NOT NULL, -- Stored as formatted text string, e.g. "Rp 1.500.000"
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'paid', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' 
    CHECK (payment_status IN ('unpaid', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Row Level Security (RLS) Policies
To ensure security while allowing clients to place bookings and admins to manage them, the following RLS policies will be applied:

1.  **Enable RLS:**
    ```sql
    ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
    ```
2.  **Public Insert Policy:** Allow anonymous (anon) users to insert bookings.
    ```sql
    CREATE POLICY "Public can insert bookings" ON public.bookings
      FOR INSERT TO anon, authenticated WITH CHECK (true);
    ```
3.  **Admin Full Access Policy:** Allow authenticated users (admins) full CRUD access to bookings.
    ```sql
    CREATE POLICY "Admin full access to bookings" ON public.bookings
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
    ```

---

## 2. Data Flow & Integration (Landing Page Sync)

When a customer makes a booking through the public forms on the landing page, the system will execute a **dual-write** to both the `customers` and `bookings` tables to preserve backward compatibility.

### Halaman Home (`Home.tsx`)
In `src/pages/Home.tsx`, the `handleBooking` method will write to the `bookings` table.

```typescript
// Save to bookings
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
```

### Halaman Sewa Mobil (`CarRental.tsx`)
In `src/pages/CarRental.tsx`, the `handleBooking` method will write to the `bookings` table.

```typescript
// Save to bookings
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
```

---

## 3. UI Layout & Navigation

### Sidebar Admin (`AdminLayout.tsx`)
A new navigation option for Booking Management will be added using the `CalendarCheck` icon from `lucide-react`.

```typescript
const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: t('dashboard') },
  { path: '/admin/bookings', icon: CalendarCheck, label: t('bookingManagement') }, // New
  { path: '/admin/stock', icon: Package, label: t('stockManagement') },
  { path: '/admin/customers', icon: Users, label: t('customerDatabase') },
];
```

### Routing (`App.tsx`)
A new protected route will be defined:

```typescript
import BookingManagement from './pages/admin/BookingManagement';

// ...
<Route path="/admin/bookings" element={<ProtectedRoute><BookingManagement /></ProtectedRoute>} />
```

---

## 4. Feature Set of `BookingManagement.tsx`

The booking management panel will contain a modern list view with robust filters, quick actions, detailed modals, and a printable invoice generator.

### Main View Components
1.  **Stats cards:** Small summary indicators at the top:
    *   Total Bookings (All)
    *   Pending Bookings
    *   Confirmed Bookings
    *   Paid Bookings
2.  **Filters:**
    *   Search Bar: Matches customer name, email, phone number, and package/car name.
    *   Booking Status filter dropdown: All, Pending, Confirmed, Paid, Completed, Cancelled.
    *   Payment Status filter dropdown: All, Unpaid, Paid.
    *   Booking Type filter dropdown: All, Package, Car.
3.  **Table:** Displays columns:
    *   Booking ID (`#${id}`)
    *   Customer (displays Name with subtext Email and Phone)
    *   Tipe (with badge: Tour / Mobil)
    *   Nama Paket / Mobil
    *   Tanggal
    *   Jumlah / Durasi (Pax / Hari)
    *   Total Harga
    *   Status Booking (Custom colored badges)
    *   Status Pembayaran (Custom colored badges)
    *   Actions (Detail, Confirm, Cancel, print/delete)

### Modals & Actions
1.  **Detail Modal**: Opens a beautiful modal showing full details, notes, customer profile, and includes dropdowns to change the booking status and payment status directly.
2.  **Quick Confirm Button**: An action on the row that changes the status of that booking to `confirmed`.
3.  **Quick Cancel Button**: An action on the row that changes the status of that booking to `cancelled`.
4.  **Cetak Invoice**: Opens a print preview modal/layout and calls `window.print()` using CSS print styles to ensure that only the invoice is printed, hiding the sidebar and other admin layout elements.

---

## 5. Dashboard Stats Integration (`AdminDashboard.tsx`)

`AdminDashboard.tsx` statistics and the "Recent Bookings" table will be updated to fetch data directly from the new `bookings` table.

```typescript
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
```

---

## 6. Language Translations (`i18n.ts`)

The following translation keys will be added to `src/lib/i18n.ts` under both `'id'` and `'en'` locales:

*   `bookingManagement`: ID: `'Kelola Booking'`, EN: `'Booking Management'`
*   `bookingId`: ID: `'ID Booking'`, EN: `'Booking ID'`
*   `paymentStatus`: ID: `'Status Pembayaran'`, EN: `'Payment Status'`
*   `unpaid`: ID: `'Belum Bayar'`, EN: `'Unpaid'`
*   `paid`: ID: `'Lunas'`, EN: `'Paid'`
*   `pending`: ID: `'Tertunda'`, EN: `'Pending'`
*   `confirmed`: ID: `'Dikonfirmasi'`, EN: `'Confirmed'`
*   `completed`: ID: `'Selesai'`, EN: `'Completed'`
*   `cancelled`: ID: `'Dibatalkan'`, EN: `'Cancelled'`
*   `invoice`: ID: `'Faktur / Invoice'`, EN: `'Invoice'`
*   `printInvoice`: ID: `'Cetak Invoice'`, EN: `'Print Invoice'`
*   `confirmBooking`: ID: `'Konfirmasi Booking'`, EN: `'Confirm Booking'`
*   `cancelBooking`: ID: `'Batalkan Booking'`, EN: `'Cancel Booking'`
*   `bookingDetails`: ID: `'Detail Booking'`, EN: `'Booking Details'`
*   `bookingType`: ID: `'Tipe Booking'`, EN: `'Booking Type'`
*   `carRental`: ID: `'Sewa Mobil'`, EN: `'Car Rental'`
*   `tourPackage`: ID: `'Paket Wisata'`, EN: `'Tour Package'`
*   `bookingSaved`: ID: `'Data booking berhasil diperbarui'`, EN: `'Booking data successfully updated'`
*   `bookingDeleted`: ID: `'Booking berhasil dihapus'`, EN: `'Booking successfully deleted'`
