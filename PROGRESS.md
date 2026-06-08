# Marjan Project Progress

## Admin Sections
- [x] 1. Categories (دسته‌بندی‌ها)
- [x] 2. Blog Management (بلاگ)
- [x] 3. Media Library (رسانه‌ها)
- [x] 4. Orders + seed data (سفارشات)
- [x] 5. Finance (مالی)
- [x] 6. Coupons (کوپن)
- [x] 7. Notifications (اطلاع‌رسانی)
- [x] 8. Comments/Reviews (نظرات)
- [x] 9. Newsletter (خبرنامه)
- [x] 10. Settings General (تنظیمات عمومی)
- [x] 11. Settings Payment (درگاه پرداخت)
- [x] 12. Settings SEO (تنظیمات SEO)
- [x] 13. Settings Security (امنیت)
- [x] 14. Backup (پشتیبان‌گیری)
- [x] 15. System Logs (لاگ سیستم)
- [x] 16. Sessions (نشست‌ها)
- [x] 17. Roles & Permissions (نقش‌ها)

## Frontend
- [x] 18. Blog frontend fix
- [x] 19. Footer categories fix
- [x] 20. User dashboard complete
- [x] 21. Rename فاکتور رسمی to فاکتور فروش

## Rules for every session:
1. Read PROGRESS.md at the start
2. Find the first unchecked item
3. Implement it completely
4. Run git add . && git commit -m "complete: [section name]" && git push
5. Mark it as done in PROGRESS.md: change [ ] to [x]
6. Run git add . && git commit -m "update: PROGRESS.md" && git push
7. Ask the user: "Section [X] is complete and saved to GitHub. 
   Ready for the next section ([Y])? 
   You can close VS Code now — next session will continue automatically from PROGRESS.md."
8. Wait for user confirmation before starting next section

## Senior Engineer Review Items (all complete)
- [x] 1. Real backup system
- [x] 2. Complete audit log
- [x] 3. Rate limiting fixes
- [x] 4. File upload security
- [x] 5. Media cleanup
- [x] 6. Soft delete + Trash
- [x] 7+8. User dashboard + order tracking
- [x] 9. Return & refund system
- [x] 10. Settings dynamic from DB
- [x] 11. End-to-end verification

## New Sections
- [x] A1. Admin sidebar badges - real DB counts
- [x] B. Security (rate limiting + upload) - done in previous session
- [x] C. Backup system - done in previous session
- [x] D. Audit log - done in previous session
- [x] E. Soft delete + Trash - done in previous session
- [x] F. User dashboard - done in previous session
- [x] G. Permission system (granular canEdit/canDelete etc.)
- [x] H. Settings dynamic - done in previous session
- [x] I. Search optimization (PostgreSQL full-text + trigram)
- [x] J. SEO (JSON-LD, OG, sitemap, robots.txt, canonical)
- [x] K. Maintenance mode
- [x] L. Migration package (ZIP + installer.html + live log)
- [x] M. E2E test script (31/31 passing)

## P3: Product Page Enhancements
- [x] P3.1 Related products (same category, exclude current)
- [x] P3.2 Product Q&A (ProductQuestion table, API, frontend tab)
- [x] P3.3 Technical Specs (ProductSpec table, admin form, frontend tab)
- [x] P3.4 Image Gallery (multiple images, thumbnails, click to change)

## P4: Admin Sidebar
- [x] P4 Fixed position, real DB counts (totalUsers, pendingOrders, pendingReviews, publishedBlogPosts), scrollable

## P5: Hardcoded Data
- [x] P5 All sidebar badges use real stats from /api/admin/stats

## Security Verify
- [x] Rate limiting on all auth/* routes (register, login, OTP send/verify, password reset)
- [x] File upload magic bytes validation (JPEG, PNG, WebP, PDF)
- [x] Soft delete working on Product/Category/Blog
- [x] Trash section in admin

## P6: End-to-End Tests
- [x] 49/49 tests passing (8 original + 4 new: specs, Q&A, return flow, CMS)

## Senior Review - Issue 1: Cleanup
- [x] Remove "something": "^0.0.1" from package.json (unused phantom dependency)
- [x] Rename proxy.ts → src/middleware.ts with correct default export (was never running!)
- [x] E2E tests: 49/49 PASS (real output verified)

## Senior Review - Issue 2: Data Integrity
- [x] Review model: userId nullable + reviewerName + SetNull on user delete
- [x] Category DELETE: set products.categoryId=null instead of blocking
- [x] Brand DELETE: new endpoint, set products.brandId=null, soft-delete
- [x] User DELETE: anonymize reviews before deletion
- [x] E2E cascade tests: 53/53 PASS

## Senior Review - Issue 3: Banner/Slider Management
- [x] Schema: startDate, endDate, targetPage, category type added to Banner
- [x] API: date-range filter on public GET, reorder PUT endpoint
- [x] Homepage: hero + promo banners loaded from DB (fallback to hardcoded if empty)
- [x] CmsManager: date pickers, targetPage selector, category type, up/down reorder buttons

## Senior Review - Issue 4: Menu Manager
- [x] Already fully implemented in CmsManager (header + footer menus, CRUD, sortOrder)

## Senior Review - Issue 5: Static Pages CMS
- [x] Page schema: metaTitle + metaDesc fields added
- [x] About page: now loads from DB with fallback
- [x] FAQ page: now loads from Faq model via /api/faq, fallback to static
- [x] Terms + Privacy: already loaded from DB (revalidate=3600)
- [x] CmsManager pages tab: metaTitle + metaDesc fields added
- [x] /api/faq public route created

## Senior Review - Issue 6: Brand Management
- [x] Brands API: full CRUD (GET/POST/PATCH/DELETE) with product count
- [x] BrandManager admin component: list, create, edit, delete with warning
- [x] /brand/[slug] public page: shows brand info + all brand products
- [x] Admin sidebar: "برندها" entry under محتوا group

## Senior Review - V7 Audit (Tasks 1–5)
- [x] Task 1: Audit scan — confirmed all 22 components ARE mounted, placeholder only for unreachable dead sections
- [x] Task 2: All sections connected (was already complete from previous session)
- [x] Task 3: Dashboard mock data replaced:
  - [x] /api/admin/analytics: 7-day chart from Payment table, real activity feed, month-over-month % changes
  - [x] Dashboard chart: live DB data with normalized bar heights
  - [x] Activity table: real recent orders + user registrations, formatted in fa-IR locale
  - [x] Stats cards: revenue/orders % changes vs previous month (calculated, not hardcoded)
  - [x] Product search: now functional (value + onChange + filter by name/SKU)
- [x] Task 4: All 22 admin sections verified — every sidebar item calls real API endpoints
- [x] Task 5: Final cleanup:
  - [x] No console.log in admin components (error.tsx console.error is correct)
  - [x] No phantom "something" dependency in package.json
  - [x] middleware.ts exists at correct path with default export
  - [x] Dead AdminSection type variants removed (shipping/invoices/tax/api-docs)
  - [x] TypeScript: 0 errors
  - [x] Fixed review upsert (@@unique removed, now findFirst+update/create)
  - [x] Fixed layout.tsx review author using reviewerName fallback

## Senior Review - 12 Issues (all complete)
- [x] Issue 1: Unified auth - removed jsonwebtoken, fixed token.role casts
- [x] Issue 2: Double security - requireAdmin() added, all 39 admin routes guarded
- [x] Issue 3: Rate limiting - admin API 100/hr/IP via middleware; auth/otp/contact already done
- [x] Issue 4: File upload - Sharp dimension limit 4000x4000 added; magic bytes/UUID/path traversal already done
- [x] Issue 5+7: Error handling - Zod + try/catch on 11 PATCH/PUT handlers; Persian errors standardized
- [x] Issue 6: Pagination - all 5 endpoints verified; users/logs standardized to totalPages format
- [x] Issue 8: Production scripts - db:migrate → deploy, db:seed → tsx, tsx installed
- [x] Issue 9: Service layer - src/services/ with productService, orderService, userService, authService
- [x] Issue 10: Size selector - disabled attr removed, OOS shows line-through + ناموجود badge + pointer cursor
- [x] Issue 11: Cart panel - already correct (left: 0, translateX(-100%)) for RTL
- [x] Issue 12: Address management:
  - [x] POST /api/addresses: max 5 check added
  - [x] PUT /api/addresses/[id]/default: new endpoint
  - [x] Dashboard: Set Default button + delete confirmation + province select dropdown
  - [x] Checkout: province select dropdown (31 Iranian provinces)
  - [x] All address API routes verified (GET/POST/PATCH/DELETE/default)

## Starting now:
Read PROGRESS.md, find first unchecked item, implement it completely, 
commit to GitHub, then ask me before continuing.

## Session Fixes (2026-06-08)
- [x] Fix 1: Product size + per-size stock in admin product form
  - New API: /api/admin/products/[id]/sizes (GET + POST replace)
  - ProductForm: INCH/MM toggle, predefined size buttons, stock input per size
  - Loads existing sizes on edit; saves with product
- [x] Fix 2: Address not saving in checkout
  - Added client-side validation (phone, postalCode, province, address)
  - Error message shown when API returns 400 (was silently swallowed)
  - Loading state on save button; textarea moved inside grid
- [x] Fix 3: 100% discount coupon = auto-complete order
  - Orders API now applies coupon discount to totalAmount
  - If totalAmount = 0: order → PROCESSING, payment → PAID (gateway: free)
  - Checkout page: isFree → skip payment, clear cart, redirect to /dashboard/orders
- [x] Fix 4: Orange hover effect on footer
  - Footer links → #e8920a on hover (0.2s transition)
  - Social icons → orange background + white icon on hover
  - Bottom bar links (terms, privacy) also orange on hover
- [x] Fix 5: GitHub auto-update after every change (done throughout)
