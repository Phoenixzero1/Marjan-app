# Redesign Progress

Reference file for "original prototype" design: `marjan (5).html` (project root)

---

## Section A: Global (highest priority)

- [x] **A1** — Brand name global field: add "نام تجاری" field in admin → general settings; every "Marjan"/"مرجان"/"ماراجان" site-wide reads from this one setting; logo also editable from settings
- [x] **A2** — Remove ALL orange hover effects site-wide; replace with subtle neutral hover

---

## Section B: Homepage

- [x] **B1** — Topbar text editable from CMS (working hours, phone) via admin content manager
- [x] **B2** — Hero Slider: convert main banner into a permanent "starred" default slide that cannot be deleted; other slides can be added/removed

---

## Section C: Cart (restore original behavior)

- [x] **C1** — Remove the separate cart PAGE entirely
- [x] **C2** — Clicking cart icon → opens cart panel (slide from left, RTL)
- [x] **C3** — Hovering cart icon → shows preview dropdown: "خلاصه سبد خرید شما - ۲ کالا" with mini product list
- [x] **C4** — Checkout flows directly from the cart panel, no separate cart page

---

## Section D: User Dashboard

- [x] **D1** — Wishlist: every product card AND product page has "add to wishlist" (heart) button that saves to wishlist
- [x] **D2** — Wallet tab: add کیف پول to dashboard with balance + transaction history (deposits/withdrawals/refunds)

---

## Section E: Auth (restore original design from marjan (5).html)

- [x] **E1** — Login modal: restore original design
- [x] **E2** — Register modal: restore original design
- [x] **E3** — Social login buttons (Google/Facebook/Twitter styling)
(Keep OTP and password reset as they are)

---

## Section F: Content Pages

- [~] **F1** — درباره ما: cancelled
- [~] **F2** — تماس با ما: cancelled
- [~] **F3** — FAQ: cancelled
- [x] **F4** — Blog list: fix date formatting (pretty/formatted), add proper spacing between date and view-count icons; apply format to ALL similar listing sections site-wide
- [x] **F5** — Search live dropdown + search results page: restore original design

---

## Section G: Search

- [x] **G1** — Live search dropdown: restore original design (done with F5)
- [x] **G2** — Search results page: restore original design (done with F5)

---

## Section H: Admin Panel

- [x] **H1** — Analytics/charts/users-list: real DB data, 7-day chart, activity table — already complete
- [x] **H2** — Categories, brands list: CategoryManager + BrandManager already complete
- [x] **H3** — Notification system: MERGED — 2-column layout (send form left + history right)
- [x] **H4** — SEO settings: fixed save error handling (shows actual API error detail + coerces string values)
- [x] **H5** — Security settings: ADDED "گزارش امنیتی" section with live system log events table
- [x] **H6** — System Logs: FIXED — pagination bug (data.pagination.total vs data.total) resolved
- [x] **H7** — Roles & Permissions: already complete with 3 tabs (users / matrix / per-user granular perms)
- [x] **H8** — Database Schema viewer: NEW DbSchemaManager component added (12 tables, fields, types)
- [x] **H9** — Orders section: ADDED "چاپ فاکتور" (print invoice) + tracking code display in order drawer
- [x] **H10** — Wallet (admin): NEW WalletManager + /api/admin/wallet (stats + transactions + admin charge/withdraw)
