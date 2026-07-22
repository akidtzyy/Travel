# Design Specification: Terms & Conditions and Privacy Policy Sections

Adding "Syarat & Ketentuan" (Terms & Conditions) and "Kebijakan Privasi" (Privacy Policy) sections at the bottom of the landing page, and linking them to the footer navigation.

## Proposed Layout & Design

To keep the landing page clean and professional while addressing legal compliance, we will implement a beautifully designed dual-card section at the bottom of the landing page (just above the footer).

- **Section Container**: A single `<section>` wrapper with a gradient background (`bg-gradient-to-br from-ocean-50 to-white`) and subtle top border (`border-t border-ocean-100/80`).
- **Two-Column Card Layout**: On desktop, the two documents will be displayed side-by-side as two premium cards with card borders, subtle shadows, and rounded borders (`rounded-3xl`). On mobile devices, they will stack vertically.
- **Scroll Margins**: Each card will have `scroll-mt-24` to ensure that when a user clicks a footer link, the viewport scrolls smoothly and stops at a comfortable distance below the sticky Navbar.
- **Icons**:
  - `ShieldAlert` or `FileText` icon for Syarat & Ketentuan.
  - `Lock` or `Shield` icon for Kebijakan Privasi.
- **Micro-animations**: Subtle hover hover-lift and shadow expansion on cards (`hover:-translate-y-1 hover:shadow-xl transition-all duration-300`).
- **Localization**: Supports language switching dynamically (Indonesian & English). Translation keys will be added to the i18n dictionary.

---

## Content Structure

### 1. Syarat & Ketentuan (Terms & Conditions)
- **Pemesanan & Pembayaran (Booking & Payment)**: Detail on 50% deposit and remaining payment terms.
- **Pembatalan & Pengembalian (Cancellation & Refund)**: Refund eligibility policies (H-3 for full refund, H-2 reschedule, <H-3 forfeit).
- **Persyaratan Sewa Mobil (Car Rental Requirements)**: SIM A, ID card/Passport handover, self-drive deposit details.
- **Batasan Penggunaan (Usage Limits)**: Geographical area restrictions (Bali island only).

### 2. Kebijakan Privasi (Privacy Policy)
- **Informasi yang Dikumpulkan (Information Collected)**: Name, email, phone number, and uploaded identity cards (KTP/SIM).
- **Penggunaan Informasi (Information Usage)**: For processing bookings, securing car rental agreements, and communicating via WhatsApp.
- **Keamanan Data (Data Security)**: Confidentiality of personal documents, automated deletion of ID photos post-rental.
- **Pihak Ketiga (Third Parties)**: No sharing or selling of user data to third parties.

---

## Proposed Changes

### Configuration / Localization

#### [MODIFY] [i18n.ts](file:///e:/Travel/src/lib/i18n.ts)
Add translation keys for the terms, conditions, privacy policy headers, and body lists so that text translates instantly when the user toggles the language switch.

### Landing Page UI

#### [MODIFY] [Home.tsx](file:///e:/Travel/src/pages/Home.tsx)
- Add the `Syarat & Kebijakan` section block right before the `<footer>` tag.
- Change the static spans in the footer under the "Informasi" column to standard anchor links referencing `#syarat-ketentuan` and `#kebijakan-privasi`.

---

## Verification Plan

### Manual Verification
- Deploy/run the local server using `npm run dev`.
- Scroll to the footer and click "Syarat & Ketentuan" / "Kebijakan Privasi" to verify smooth scrolling behavior to the corresponding card.
- Verify that the card is positioned beautifully under the navigation bar and does not get cut off.
- Switch languages (ID/EN) using the navbar flag/locale switch to verify that terms and policies content updates instantly.
- Verify mobile responsiveness by resizing the browser window.
