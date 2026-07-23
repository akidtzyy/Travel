# Design Spec: Dedicated Terms & Privacy Policy Page

## Goal
Extract the "Syarat & Ketentuan" (Terms & Conditions) and "Kebijakan Privasi" (Privacy Policy) sections from the main landing page (`Home.tsx`) and host them in a new dedicated page (`/ketentuan-privasi`). The new page will feature a modern tabbed interface with deep-linking support, ensuring that links from the Navbar and Footer open the correct tab directly.

---

## Proposed Changes

### 1. Route Definition
* **Modify**: `src/App.tsx`
  * Add a route `/ketentuan-privasi` pointing to the new `Legal` component.
  * Import `Legal` from `./pages/Legal`.

### 2. New Page Component
* **New File**: `src/pages/Legal.tsx`
  * Renders `Navbar` at the top and `Footer` at the bottom.
  * Main content uses a responsive grid with a container width of `max-w-4xl`.
  * **Header Section**:
    * Clean typography with Indonesian and English translation support.
    * "Kembali ke Beranda" button with a left-arrow icon linking to `/`.
  * **Tab System**:
    * Renders a custom tab switcher using Framer Motion animations for active tab indicator.
    * Tabs: "Syarat & Ketentuan" (with `FileText` icon) and "Kebijakan Privasi" (with `Lock` icon).
    * Handles deep-linking via query parameters (`?tab=terms` and `?tab=privacy`). On component mount or URL changes, updates the active tab state accordingly.
  * **Content**:
    * Displays structured list items matching the translations defined in `src/lib/i18n.ts`.

### 3. Navigation Component Updates
* **Modify**: `src/components/Navbar.tsx`
  * Update hash links from `/#syarat-ketentuan` to `/ketentuan-privasi?tab=terms` and `/#kebijakan-privasi` to `/ketentuan-privasi?tab=privacy`.
* **Modify**: `src/components/Footer.tsx`
  * Update hash links from `/#syarat-ketentuan` to `/ketentuan-privasi?tab=terms` and `/#kebijakan-privasi` to `/ketentuan-privasi?tab=privacy`.

### 4. Landing Page Cleanup
* **Modify**: `src/pages/Home.tsx`
  * Remove the "Syarat & Kebijakan Section" container (roughly lines 1040 to 1200) to keep the landing page clean.

---

## Verification Plan

### Manual Verification
1. Open the home page and click "Syarat & Ketentuan" in the Navbar. Verify it navigates to `/ketentuan-privasi?tab=terms` and shows the Terms tab.
2. Click "Kebijakan Privasi" in the Footer. Verify it navigates to `/ketentuan-privasi?tab=privacy` and displays the Privacy tab.
3. Verify page looks visually premium, has smooth tab transitions, and supports English and Indonesian languages when switching localizations via the language selector.
4. Run `npm run build` to verify there are no TypeScript or compilation errors.
