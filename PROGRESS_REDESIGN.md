# Redesign Progress

Reference file for "original prototype" design: `marjan (5).html` (project root)

---

## Section A: Global (highest priority)

- [x] **A1** — Brand name global field: add "نام تجاری" field in admin → general settings; every "Marjan"/"مرجان"/"ماراجان" site-wide reads from this one setting; logo also editable from settings
- [x] **A2** — Remove ALL orange hover effects site-wide; replace with subtle neutral hover

---

## Section B: Homepage

- [x] **B1** — Topbar text editable from CMS (working hours, phone) via admin content manager
- [ ] **B2** — Hero Slider: convert main banner into a permanent "starred" default slide that cannot be deleted; other slides can be added/removed

---

## Section C: Cart (restore original behavior)

- [ ] **C1** — Remove the separate cart PAGE entirely
- [ ] **C2** — Clicking cart icon → opens cart panel (slide from left, RTL)
- [ ] **C3** — Hovering cart icon → shows preview dropdown: "خلاصه سبد خرید شما - ۲ کالا" with mini product list
- [ ] **C4** — Checkout flows directly from the cart panel, no separate cart page

---

## Section D: User Dashboard

- [ ] **D1** — Wishlist: every product card AND product page has "add to wishlist" (heart) button that saves to wishlist
- [ ] **D2** — Wallet tab: add کیف پول to dashboard with balance + transaction history (deposits/withdrawals/refunds)

---

## Section E: Auth (restore original design from marjan (5).html)

- [ ] **E1** — Login modal: restore original design
- [ ] **E2** — Register modal: restore original design
- [ ] **E3** — Social login buttons (Google/Facebook/Twitter styling)
(Keep OTP and password reset as they are)

---

## Section F: Content Pages

- [ ] **F1** — درباره ما: restore top section original design from marjan (5).html (keep bottom section)
- [ ] **F2** — تماس با ما: restore original design
- [ ] **F3** — FAQ: restore original design
- [ ] **F4** — Blog list: fix date formatting (pretty/formatted), add proper spacing between date and view-count icons; apply format to ALL similar listing sections site-wide
- [ ] **F5** — Search live dropdown + search results page: restore original design

---

## Section G: Search

- [ ] **G1** — Live search dropdown: restore original design
- [ ] **G2** — Search results page: restore original design

---

## Section H: Admin Panel

- [ ] **H1** — Analytics/charts/users-list/roles: restore original design from marjan (5).html
- [ ] **H2** — Categories, brands list: restore original design
- [ ] **H3** — Notification system: MERGE — keep new features + add extra section from new version (combine both)
- [ ] **H4** — SEO settings: MERGE old design + new functionality (fix save error "خطا در ذخیره تنظیمات")
- [ ] **H5** — Security settings: ADD "گزارش امنیتی" (security report) section
- [ ] **H6** — System Logs: FIX completely — logs don't work at all; make it capture and display all system logs, errors, and events
- [ ] **H7** — Roles & Permissions: MERGE — keep new look + add granular permission management for admins
- [ ] **H8** — Database Schema viewer: add DB schema/diagram page from old version
- [ ] **H9** — Orders section: MERGE shipping management + invoices + invoice download (like old version had combined)
- [ ] **H10** — Wallet (admin): add wallet management showing deposit/withdrawal transactions + allow admin to withdraw from wallet
