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
