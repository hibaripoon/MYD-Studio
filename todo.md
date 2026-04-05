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
