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

## Starting now:
Read PROGRESS.md, find first unchecked item, implement it completely, 
commit to GitHub, then ask me before continuing.
