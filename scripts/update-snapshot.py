#!/usr/bin/env python3
"""
Update drizzle meta snapshot to match new schema (Round 25).
This prevents interactive prompts on next db:push.
"""
import json
import time
import shutil
import os

SNAPSHOT_DIR = "/home/ubuntu/media-crm/drizzle/meta"
JOURNAL_FILE = os.path.join(SNAPSHOT_DIR, "_journal.json")

# Read the current journal
with open(JOURNAL_FILE) as f:
    journal = json.load(f)

# Find latest snapshot index
latest_idx = max(e["idx"] for e in journal["entries"])
latest_snapshot_file = os.path.join(SNAPSHOT_DIR, f"{latest_idx:04d}_snapshot.json")

with open(latest_snapshot_file) as f:
    snapshot = json.load(f)

print(f"Current snapshot: {latest_snapshot_file}")
print(f"Current tables: {list(snapshot.get('tables', {}).keys())}")

# New schema definition matching drizzle/schema.ts
new_tables = {
    "users": {
        "name": "users",
        "schema": "",
        "columns": {
            "openId": {"name": "openId", "type": "varchar(128)", "primaryKey": True, "notNull": True, "autoincrement": False},
            "name": {"name": "name", "type": "varchar(128)", "primaryKey": False, "notNull": False, "autoincrement": False},
            "email": {"name": "email", "type": "varchar(256)", "primaryKey": False, "notNull": False, "autoincrement": False},
            "loginMethod": {"name": "loginMethod", "type": "varchar(64)", "primaryKey": False, "notNull": False, "autoincrement": False},
            "createdAt": {"name": "createdAt", "type": "timestamp", "primaryKey": False, "notNull": True, "autoincrement": False, "default": "now()"},
        },
        "indexes": {},
        "foreignKeys": {},
        "compositePrimaryKeys": {},
        "uniqueConstraints": {},
    },
    "app_users": snapshot["tables"].get("app_users", {
        "name": "app_users",
        "schema": "",
        "columns": {},
        "indexes": {},
        "foreignKeys": {},
        "compositePrimaryKeys": {},
        "uniqueConstraints": {},
    }),
    "system_settings": snapshot["tables"].get("system_settings", {
        "name": "system_settings",
        "schema": "",
        "columns": {},
        "indexes": {},
        "foreignKeys": {},
        "compositePrimaryKeys": {},
        "uniqueConstraints": {},
    }),
    "projects": {
        "name": "projects",
        "schema": "",
        "columns": {
            "id": {"name": "id", "type": "varchar(32)", "primaryKey": True, "notNull": True, "autoincrement": False},
            "name": {"name": "name", "type": "varchar(256)", "primaryKey": False, "notNull": True, "autoincrement": False},
            "description": {"name": "description", "type": "text", "primaryKey": False, "notNull": False, "autoincrement": False},
            "color": {"name": "color", "type": "varchar(64)", "primaryKey": False, "notNull": False, "autoincrement": False, "default": "'bg-blue-500'"},
            "ownerId": {"name": "ownerId", "type": "varchar(32)", "primaryKey": False, "notNull": False, "autoincrement": False},
            "createdAt": {"name": "createdAt", "type": "timestamp", "primaryKey": False, "notNull": True, "autoincrement": False, "default": "now()"},
            "updatedAt": {"name": "updatedAt", "type": "timestamp", "primaryKey": False, "notNull": True, "autoincrement": False, "default": "now()"},
        },
        "indexes": {"projects_owner_id_idx": {"name": "projects_owner_id_idx", "columns": ["ownerId"], "isUnique": False}},
        "foreignKeys": {},
        "compositePrimaryKeys": {},
        "uniqueConstraints": {},
    },
    "items": {
        "name": "items",
        "schema": "",
        "columns": {
            "id": {"name": "id", "type": "varchar(32)", "primaryKey": True, "notNull": True, "autoincrement": False},
            "projectId": {"name": "projectId", "type": "varchar(32)", "primaryKey": False, "notNull": False, "autoincrement": False},
            "title": {"name": "title", "type": "varchar(512)", "primaryKey": False, "notNull": True, "autoincrement": False},
            "description": {"name": "description", "type": "text", "primaryKey": False, "notNull": False, "autoincrement": False},
            "type": {"name": "type", "type": "enum('task','meeting')", "primaryKey": False, "notNull": True, "autoincrement": False, "default": "'task'"},
            "status": {"name": "status", "type": "enum('todo','in_progress','review','done','cancelled')", "primaryKey": False, "notNull": True, "autoincrement": False, "default": "'todo'"},
            "priority": {"name": "priority", "type": "enum('low','medium','high','urgent')", "primaryKey": False, "notNull": True, "autoincrement": False, "default": "'medium'"},
            "assigneeIds": {"name": "assigneeIds", "type": "json", "primaryKey": False, "notNull": False, "autoincrement": False},
            "responsibleId": {"name": "responsibleId", "type": "varchar(32)", "primaryKey": False, "notNull": False, "autoincrement": False},
            "dueDate": {"name": "dueDate", "type": "varchar(16)", "primaryKey": False, "notNull": False, "autoincrement": False},
            "dueTime": {"name": "dueTime", "type": "varchar(8)", "primaryKey": False, "notNull": False, "autoincrement": False},
            "endDate": {"name": "endDate", "type": "varchar(16)", "primaryKey": False, "notNull": False, "autoincrement": False},
            "endTime": {"name": "endTime", "type": "varchar(8)", "primaryKey": False, "notNull": False, "autoincrement": False},
            "location": {"name": "location", "type": "varchar(256)", "primaryKey": False, "notNull": False, "autoincrement": False},
            "createdBy": {"name": "createdBy", "type": "varchar(32)", "primaryKey": False, "notNull": False, "autoincrement": False},
            "createdAt": {"name": "createdAt", "type": "timestamp", "primaryKey": False, "notNull": True, "autoincrement": False, "default": "now()"},
            "updatedAt": {"name": "updatedAt", "type": "timestamp", "primaryKey": False, "notNull": True, "autoincrement": False, "default": "now()"},
        },
        "indexes": {
            "items_project_id_idx": {"name": "items_project_id_idx", "columns": ["projectId"], "isUnique": False},
            "items_type_idx": {"name": "items_type_idx", "columns": ["type"], "isUnique": False},
            "items_status_idx": {"name": "items_status_idx", "columns": ["status"], "isUnique": False},
            "items_responsible_id_idx": {"name": "items_responsible_id_idx", "columns": ["responsibleId"], "isUnique": False},
        },
        "foreignKeys": {},
        "compositePrimaryKeys": {},
        "uniqueConstraints": {},
    },
    "item_comments": {
        "name": "item_comments",
        "schema": "",
        "columns": {
            "id": {"name": "id", "type": "varchar(32)", "primaryKey": True, "notNull": True, "autoincrement": False},
            "itemId": {"name": "itemId", "type": "varchar(32)", "primaryKey": False, "notNull": True, "autoincrement": False},
            "authorId": {"name": "authorId", "type": "varchar(32)", "primaryKey": False, "notNull": True, "autoincrement": False},
            "authorName": {"name": "authorName", "type": "varchar(128)", "primaryKey": False, "notNull": True, "autoincrement": False},
            "content": {"name": "content", "type": "text", "primaryKey": False, "notNull": True, "autoincrement": False},
            "createdAt": {"name": "createdAt", "type": "timestamp", "primaryKey": False, "notNull": True, "autoincrement": False, "default": "now()"},
        },
        "indexes": {"item_comments_item_id_idx": {"name": "item_comments_item_id_idx", "columns": ["itemId"], "isUnique": False}},
        "foreignKeys": {},
        "compositePrimaryKeys": {},
        "uniqueConstraints": {},
    },
    "meeting_notes": {
        "name": "meeting_notes",
        "schema": "",
        "columns": {
            "id": {"name": "id", "type": "varchar(32)", "primaryKey": True, "notNull": True, "autoincrement": False},
            "itemId": {"name": "itemId", "type": "varchar(32)", "primaryKey": False, "notNull": True, "autoincrement": False},
            "authorId": {"name": "authorId", "type": "varchar(32)", "primaryKey": False, "notNull": True, "autoincrement": False},
            "authorName": {"name": "authorName", "type": "varchar(128)", "primaryKey": False, "notNull": True, "autoincrement": False},
            "content": {"name": "content", "type": "text", "primaryKey": False, "notNull": True, "autoincrement": False},
            "createdAt": {"name": "createdAt", "type": "timestamp", "primaryKey": False, "notNull": True, "autoincrement": False, "default": "now()"},
        },
        "indexes": {"meeting_notes_item_id_idx": {"name": "meeting_notes_item_id_idx", "columns": ["itemId"], "isUnique": False}},
        "foreignKeys": {},
        "compositePrimaryKeys": {},
        "uniqueConstraints": {},
    },
}

# Build new snapshot
new_snapshot = {
    "version": snapshot.get("version", "5"),
    "dialect": snapshot.get("dialect", "mysql"),
    "id": snapshot.get("id", ""),
    "prevId": snapshot.get("id", ""),
    "tables": new_tables,
    "views": {},
    "_meta": {"columns": {}, "schemas": {}, "tables": {}},
}

# Write new snapshot as index 8
new_idx = latest_idx + 1
new_snapshot_file = os.path.join(SNAPSHOT_DIR, f"{new_idx:04d}_snapshot.json")
with open(new_snapshot_file, "w") as f:
    json.dump(new_snapshot, f, indent=2)

# Update journal
new_entry = {
    "idx": new_idx,
    "version": "5",
    "when": int(time.time() * 1000),
    "tag": f"{new_idx:04d}_round25_restructure",
    "breakpoints": True,
}
journal["entries"].append(new_entry)
with open(JOURNAL_FILE, "w") as f:
    json.dump(journal, f, indent=2)

print(f"\n✓ Created snapshot: {new_snapshot_file}")
print(f"✓ Updated journal with entry: {new_entry['tag']}")
print(f"New tables: {list(new_tables.keys())}")
