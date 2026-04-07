# Media CRM TODO

## Database Migration (Persistent Backend)
- [x] Upgrade project to web-db-user (Backend + Database)
- [x] Design and migrate database schema (12 tables: appUsers, customers, tasks, workItems, internalTasks, cashCollections, financialDocuments, revenueItems, taskComments, activityLogs, systemSettings)
- [x] Create tRPC API routes for all entities (appUsers, customers, tasks, workItems, internalTasks, cashCollections, financialDocs, revenueItems, comments, activityLogs, settings)
- [x] Rewrite DatabaseContext to use tRPC instead of in-memory store
- [x] Migrate TaskDetailPage mutations to tRPC (workItems, internalTasks, comments, revenueItems, financialDocs, cashCollection, task status)
- [x] Migrate SystemSettingsTab to tRPC (settings.get / settings.set)
- [x] Migrate UserManagementContent to tRPC (appUsers CRUD)
- [x] Write unit tests for all new tRPC routers (16 tests passing)

## Bug Fixes
- [x] Fix AE filter in Work List (DashboardTab) — now uses appUsers from useDatabase()
- [x] Fix Work List filters to pull Media/Product Type from Settings
- [x] Fix Revenue Breakdown dropdowns to pull from Settings (mediaItems, productItems)

## Pending / Future Work
- [x] Migrate AEPortal.tsx auth to use tRPC appUsers (currently uses legacy getSession/db.getUserById)
- [x] Migrate TaskManagementTab.tsx to use tRPC for task creation
- [x] Migrate CustomerCRMTab.tsx to use tRPC for customer CRUD
- [x] Migrate CashCollectionTab.tsx to use tRPC for current-user resolution
- [x] Migrate AccountSettingsTab.tsx to use tRPC appUsers.update
- [x] Migrate UserManagementPage.tsx (standalone page) to use tRPC appUsers.* mutations

## Bug Fixes - Round 3 (Full System Audit)
- [x] Fix Work Item add/edit/delete in TaskDetailPage
- [x] Fix Internal Task add/edit/delete in TaskDetailPage
- [x] Fix Financial Document (เอกสาร) add/edit/delete in TaskDetailPage
- [x] Fix Revenue Breakdown add/edit/delete in TaskDetailPage
- [x] Verify task status changes (complete, revert, cancel) work correctly
- [x] Verify cash collection status update works
- [x] Verify task comments work
- [x] Verify Dashboard Work List shows correct data after revenue items added
- [x] Verify Settings (Media/Product Type) save and reflect in Revenue Breakdown dropdowns
- [x] Verify Login flow works with tRPC
- [x] Verify Customer CRM add/edit/delete works
- [x] Verify User Management add/edit/delete works

## Bug Fixes & Improvements - Round 4 (User Request)
- [x] Add real file upload support for Work Item completion (S3 storage via base64 upload)
- [x] Update Complete Work dialog with drag-drop style file upload area
- [x] Add URL input field for Google Drive / Dropbox links in evidence dialog
- [x] Add files tRPC router for file upload endpoint
- [x] Verify all features work end-to-end: Work Items, Internal Tasks, Financial Documents, Revenue Breakdown

## Bug Fixes & Improvements - Round 5 (User Feedback)
- [x] Fix duplicate task creation (task created twice when clicking สร้าง Task)
- [x] Add Edit button to Task card in Task Management page
- [x] Show contact info (ผู้ติดต่อ) in Task detail header
- [x] Move Notes module below Internal Tasks (left column)
- [x] Move Activity Log module below Revenue Breakdown (right column)
- [x] Add cash amount field (ยอดที่เก็บได้จริง) to Cash Collection module in Task detail
- [x] Simplify Cash Collection dashboard: keep only 4 boxes (ยังไม่เก็บเงิน, ส่ง Invoice แล้ว, ชำระครบแล้ว, ยอดทั้งหมด) and remove มูลค่างานทั้งหมด, เอกสารทั้งหมด, %Collection Rate

## Bug Fixes - Round 6
- [x] Remove Partial Payment status entirely from the system (schema, router, UI, dashboard, existing DB records migrated to invoiced)
- [x] Fix Cash Collection dashboard: taskAmount() now always uses cashCollection.amount (not Revenue Breakdown total)

## Bug Fixes - Round 7
- [x] Add Edit Task button in TaskDetailPage header (same fields as Create Task: customer, title, contact name/phone/email, AE, amount, brief)
- [x] Remove ยอดที่เก็บได้จริง display box from Cash Collection section in TaskDetailPage

## Bug Fixes - Round 8
- [x] Fix nested button error on TaskDetailPage (/ae/task/:id) - changed TaskCard outer button to div with role=button

## Performance Optimizations - Round 9
- [x] Add DB indexes on taskId for all child tables (work_items, internal_tasks, cash_collections, financial_documents, revenue_items, task_comments, activity_logs)
- [x] Add useMemo to DatabaseContext for customers/tasks/appUsers mapping
- [x] Add lookup maps (userMap, customerMap) in DashboardTab to replace O(n²) find() calls
- [x] Add lookup maps (userMap, customerMap) in CashCollectionTab to replace O(n²) find() calls
- [x] Move seedIfEmpty() from tasks.list handler to server boot (index.ts)
- [x] Implement selective invalidation in mutations (invalidate only tasks, not customers/appUsers/settings)
- [x] Create tasks.listLight query (skips comments & activity_logs for list/dashboard views, detail views use tasks.byId)

## Intermittent Query Fix - Round 10
- [x] Fix drizzle DB pool: use explicit createPool with supportBigNumbers, waitForConnections, connectionLimit=10
- [x] Fix CustomerPortal race condition: show loading spinner while isLoading=true instead of "ไม่พบข้อมูลลูกค้า"
- [x] Fix AEPortal race condition: show loading spinner while isLoading=true instead of blank screen
- [x] Fix LoginPage session restore: store customerId in session so customer redirect uses correct ID
- [x] Add global QueryClient staleTime=30s and refetchOnWindowFocus=false to reduce refetch churn

## UI Fix - Round 11
- [x] Fix CustomerCRMTab stat cards: make "มูลค่ารวม" card have same font size, number size, and layout as "งานทั้งหมด" and "กำลังทำ" cards

## UI Fix - Round 12
- [x] Fix CustomerCRMTab stat cards: มูลค่ารวม number font must be exactly same size as งานทั้งหมด/กำลังทำ — reduce font size on long currency strings to fit, and align label text consistently

## UI Fix - Round 13
- [x] Fix CashCollectionTab document badges: put all doc type badges in a single horizontal scrollable row, show total file count badge at the end of the row

## Data Cleanup - Round 14
- [x] Delete all demo data (tasks, customers, work_items, internal_tasks, cash_collections, financial_documents, revenue_items, task_comments, activity_logs, system_settings) — keep only the original admin appUser

## Branding - Round 15
- [x] Remove demo hint box (ข้อมูล Demo สำหรับทดสอบ) from LoginPage
- [x] Rename app title to "mydstudio" in all places (index.html, LoginPage, AEPortal, CustomerPortal, LandingPage, SystemSettingsTab, DatabaseContext, db.ts)

## Branding - Round 16
- [x] Rename "mydstudio" → "MYD Studio" everywhere in the codebase

## Feature - Round 17
- [x] Add email input field to Add/Edit User form in UserManagementContent (already in Create form, added to Edit form)

## Bug Fix + Feature - Round 18
- [x] Fix work item edit: clicking "บันทึก" does nothing — dueDate was required in condition, made it optional
- [x] Brief field: support both text typing and file upload (upload to S3, stored in briefFiles JSON column)

## Feature - Round 19
- [x] Customer User Management in CustomerCRMTab: add/view/delete customer users directly from each customer's drawer/card
- [x] Customer Logo upload: add logo image upload (S3) to customer create/edit form, display logo in CRM list and customer drawer
- [x] Financial Document file upload: add file upload option to financial documents module in Task Detail (store file URL in S3)

## UI Fix - Round 20
- [x] Task Card ใน Task Management tab แสดง logo/avatar ของ Customer (profilePhoto หรือ avatarInitials+avatarColor) แทน avatar ทั่วไป

## UI Improvements - Round 21
- [x] Cash Collection Tab: Task cards แสดง logo ของ Customer (profilePhoto หรือ avatarInitials+avatarColor)
- [x] Customer Portal: Profile picture ของ User แสดง logo ของ Customer นั้นๆ
- [x] Customer CRM Tab: เพิ่มปุ่ม List/Grid view toggle (ปัจจุบัน Grid)
- [x] Task Management Tab: เพิ่มปุ่ม List/Grid view toggle (ปัจจุบัน List)
- [x] Cash Collection Tab: เพิ่มปุ่ม List/Grid view toggle (ปัจจุบัน List)
- [x] Task Management Tab: เพิ่ม Filter AE โดย default เป็น AE ที่ login อยู่
- [x] Cash Collection Tab: เพิ่ม Filter AE โดย default เป็น AE ที่ login อยู่

## Bug Fix - Round 22 (AE Filter)
- [x] Fix AE filter bug: tasks store aeId as user_ae1/user_ae2/user_ae3 but filter uses ae1/ae2/ae3 — fix dropdown to use appUser.id as value
- [x] Make AE filter visible to ALL users (remove !isAEOnly condition) in TaskManagementTab and CashCollectionTab

## UI Update - Round 23
- [x] เปลี่ยนชื่อ Tab จาก "Task Management" เป็น "Sponsor Management" ในทุกที่
- [x] Task Detail Page: แสดง profilePhoto ของ Customer ในส่วน header (ปัจจุบันแสดงแค่ avatarInitials)
