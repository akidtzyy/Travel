# Connect Admin Panel Database to Landing Page Tour Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the admin panel's package form to the `included` JSON column in Supabase and prevent page crashes by adding optional chaining and UI inputs for hotels, prices, and itineraries.

**Architecture:** Use React state tabs inside the admin package modal, allowing structured management of hotel options/prices and daily itineraries, writing the structured payload to the database. Add defensive rendering in the frontend.

**Tech Stack:** React, TypeScript, Vite, Supabase JS

## Global Constraints

- Code must build successfully using `npm run build` without any compilation errors.
- Do not lose existing `included` data during save operations.

---

### Task 1: Add Frontend Fallbacks and Defensive Rendering

**Files:**
- Modify: `src/components/PackageCard.tsx`
- Modify: `src/pages/Home.tsx`

**Interfaces:**
- Consumes: `tour_packages` database table data.
- Produces: Safe rendering of tour packages even if the `included` field is missing or empty.

- [ ] **Step 1: Update PackageCard.tsx fallbacks**

  Modify `src/components/PackageCard.tsx` to handle cases where `pkg.included`, `pkg.included.hotels`, or `pkg.included.itinerary` is undefined. Use optional chaining and default values:
  - Check `lowestPrice` computation:
    ```typescript
    const firstHotel = pkg.included?.hotels?.[0];
    const lowestPrice = firstHotel?.prices 
      ? Math.min(...Object.values(firstHotel.prices)) 
      : pkg.price || 0;
    ```
  - Check `usePaxPricing` check:
    ```typescript
    const usePaxPricing = !isHoneymoon && (pkg.included?.hotels?.length ?? 0) > 0;
    ```
  - Double check rendering and maps:
    ```typescript
    {pkg.highlights?.slice(0, 6).map(...)}
    {pkg.included?.itinerary?.map(...)}
    {pkg.included?.includes_list && (...)}
    {pkg.included?.excludes_list && (...)}
    {pkg.included?.hotels?.map(...)}
    ```

- [ ] **Step 2: Update Home.tsx package dropdown and pricing selection**

  Modify `src/pages/Home.tsx` to safely access `included` fields:
  - Check `isPaxPricing` and `paxOptions` computations:
    ```typescript
    const isPaxPricing = useMemo(() => {
      if (!selectedHotel) return true;
      return Object.keys(selectedHotel.prices).every(k => k in paxLabels);
    }, [selectedHotel]);

    const paxOptions = useMemo(() => {
      if (!selectedHotel) return [];
      return Object.keys(selectedHotel.prices).map(key => ({
        key,
        label: paxLabels[key] || key,
        price: selectedHotel.prices[key],
      }));
    }, [selectedHotel]);
    ```
  - Update `onSelect` handler:
    ```typescript
    onSelect={(selectedPkg, hotel, pax, price) => {
      setSelectedPkgId(selectedPkg.id); 
      const hotelIdx = selectedPkg.included?.hotels?.findIndex(h => h.hotel === hotel) ?? 0;
      setSelectedHotelIdx(hotelIdx >= 0 ? hotelIdx : 0);
      setSelectedPaxKey(pax);
      setBookingForm(p => ({
        ...p,
        booking_type: 'package',
        item_name: `${translateText(selectedPkg.name)} — ${hotel}`,
        duration: paxLabels[pax] || pax,
        total_price: formatPrice(price)
      }));
      setTimeout(() => {
        document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }}
    ```
  - Update rendering in the booking form:
    ```typescript
    {selectedPkg?.included?.hotels && (
      // ...
      {selectedPkg.included.hotels.map(...)}
    )}
    ```

- [ ] **Step 3: Run build to verify types**

  Run: `npm run build`
  Expected: PASS

- [ ] **Step 4: Commit changes**

  Run:
  ```bash
  git add src/components/PackageCard.tsx src/pages/Home.tsx
  git commit -m "fix: add robust optional chaining and fallbacks for tour package included details"
  ```

---

### Task 2: Update Package Types, Form State, and DB Operations in StockManagement.tsx

**Files:**
- Modify: `src/pages/admin/StockManagement.tsx`

**Interfaces:**
- Consumes: Supabase `tour_packages` table schema.
- Produces: Updated package state models and save payloads that preserve the `included` column.

- [ ] **Step 1: Extend PackageItem interface and pkgForm state**

  Update `PackageItem` interface in `src/pages/admin/StockManagement.tsx`:
  ```typescript
  interface PackageItem {
    id: number;
    name: string;
    description: string;
    duration: string;
    price: number;
    highlights: string[];
    image_url: string;
    category: string;
    is_available?: boolean;
    included?: {
      hotels?: Array<{ hotel: string; prices: Record<string, number> }>;
      itinerary?: Array<{ day: number; title: string; activities: string[] }>;
      includes_list?: string[];
      excludes_list?: string[];
    };
  }
  ```

  Update the `pkgForm` initial state and types to match the extended schema.

- [ ] **Step 2: Update openPkgModal and savePkg methods**

  Modify `openPkgModal` to populate the `included` form state, falling back to a default structure for new packages:
  ```typescript
  const openPkgModal = (pkg?: PackageItem) => {
    if (pkg) {
      setEditingPkg(pkg);
      setPkgForm({
        name: pkg.name,
        description: pkg.description || '',
        duration: pkg.duration || '',
        price: pkg.price,
        highlights: pkg.highlights?.join(', ') || '',
        image_url: pkg.image_url || '',
        category: pkg.category || '',
        is_available: pkg.is_available !== false,
        included: pkg.included || { hotels: [], itinerary: [] }
      });
    } else {
      setEditingPkg(null);
      setPkgForm({
        name: '',
        description: '',
        duration: '',
        price: 0,
        highlights: '',
        image_url: '',
        category: '',
        is_available: true,
        included: {
          hotels: [
            { hotel: 'Standard Hotel', prices: { '2pax': 1000000 } }
          ],
          itinerary: [
            { day: 1, title: 'Hari 1', activities: ['Penjemputan bandara'] }
          ]
        }
      });
    }
    setShowPkgModal(true);
  };
  ```

  Modify `savePkg` to append `included` to the write payload:
  ```typescript
    const data = {
      name: pkgForm.name,
      description: pkgForm.description,
      duration: pkgForm.duration,
      price: pkgForm.price,
      highlights: pkgForm.highlights.split(',').map(h => h.trim()).filter(Boolean),
      image_url: pkgForm.image_url,
      category: pkgForm.category,
      is_available: pkgForm.is_available,
      included: pkgForm.included,
    };
  ```

- [ ] **Step 3: Run build to verify compilation**

  Run: `npm run build`
  Expected: PASS

- [ ] **Step 4: Commit changes**

  Run:
  ```bash
  git add src/pages/admin/StockManagement.tsx
  git commit -m "feat: extend package types and database operations to handle included details"
  ```

---

### Task 3: Build Hotels and Itinerary UI Editors in StockManagement.tsx Package Modal

**Files:**
- Modify: `src/pages/admin/StockManagement.tsx`

**Interfaces:**
- Consumes: Updated `pkgForm` state.
- Produces: Visual editor tabs in the admin package modal.

- [ ] **Step 1: Add active tab state inside Package Modal rendering**

  Introduce a local tab state in the modal:
  ```typescript
  const [modalTab, setModalTab] = useState<'info' | 'hotels' | 'itinerary'>('info');
  ```
  Ensure `setModalTab('info')` is called inside `openPkgModal` to reset the active tab when opening.

- [ ] **Step 2: Build Hotels and Pricing Editor View**

  Implement interface controls to add/remove hotels, edit hotel names, and manage pax-based or standard pricing points dynamically.

- [ ] **Step 3: Build Itinerary Editor View**

  Implement interface controls to add/remove days, edit day titles, and manage activities as a textarea list of lines.

- [ ] **Step 4: Run build and verify styling**

  Run: `npm run build`
  Expected: PASS

- [ ] **Step 5: Commit changes**

  Run:
  ```bash
  git add src/pages/admin/StockManagement.tsx
  git commit -m "feat: add beautiful hotel and itinerary editors to the package admin modal"
  ```
