/**
 * AE Portal — Main layout with sidebar navigation
 * Design: Modern SaaS — Dark sidebar + Light content
 * Tabs: Tasks | Meetings | Calendar | Dashboard | Settings
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Users, LogOut,
  ChevronRight, Bell, Menu, X, Settings, UserCog, CalendarDays,
  CheckSquare, Video, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearSession, getSession } from "@/lib/database";
import { trpc } from "@/lib/trpc";
import UserManagementContent from "@/components/ae/UserManagementContent";
import DashboardTab from "@/components/ae/DashboardTab";
import AccountSettingsTab from "@/components/ae/AccountSettingsTab";
import SystemSettingsTab from "@/components/ae/SystemSettingsTab";
import CalendarTab from "@/components/ae/CalendarTab";
import TasksTab from "@/components/ae/TasksTab";
import MeetingsTab from "@/components/ae/MeetingsTab";
import type { AppUser } from "@/lib/database";

type TabId = "tasks" | "meetings" | "calendar" | "users" | "dashboard" | "account" | "settings";

const navItems = [
  { id: "tasks" as TabId, label: "งาน (Tasks)", icon: CheckSquare, path: "/ae/tasks" },
  { id: "meetings" as TabId, label: "การประชุม", icon: Video, path: "/ae/meetings" },
  { id: "calendar" as TabId, label: "ปฏิทิน", icon: CalendarDays, path: "/ae/calendar" },
];

const systemItems = [
  { id: "dashboard" as TabId, label: "Dashboard", icon: LayoutDashboard, path: "/ae/dashboard", adminOnly: false },
  { id: "users" as TabId, label: "จัดการผู้ใช้", icon: UserCog, path: "/ae/users", adminOnly: true },
  { id: "settings" as TabId, label: "ตั้งค่าระบบ", icon: Settings, path: "/ae/settings", adminOnly: true },
];

export default function AEPortal() {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const { data: appUsersData } = trpc.appUsers.list.useQuery();

  // Auth guard
  useEffect(() => {
    const session = getSession();
    if (!session) { navigate("/login"); return; }
    if (session.role !== "company") {
      clearSession();
      navigate("/login");
      return;
    }
    setSessionUserId(session.userId);
  }, [navigate]);

  // Find current user from DB
  useEffect(() => {
    if (!sessionUserId || !appUsersData) return;
    const user = appUsersData.find((u) => u.id === sessionUserId);
    if (user) {
      setCurrentUser(user as AppUser);
    } else {
      clearSession();
      navigate("/login");
    }
  }, [sessionUserId, appUsersData, navigate]);

  // Determine active tab from URL
  const activeTab: TabId = location.includes("/users")
    ? "users"
    : location.includes("/dashboard")
    ? "dashboard"
    : location.includes("/account")
    ? "account"
    : location.includes("/settings")
    ? "settings"
    : location.includes("/meetings")
    ? "meetings"
    : location.includes("/calendar")
    ? "calendar"
    : "tasks";

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  const TAB_TITLES: Record<TabId, string> = {
    tasks: "งาน (Tasks)",
    meetings: "การประชุม",
    calendar: "ปฏิทิน",
    users: "จัดการผู้ใช้",
    dashboard: "Dashboard",
    account: "ตั้งค่าบัญชี",
    settings: "ตั้งค่าระบบ",
  };

  const TAB_SUBTITLES: Record<TabId, string> = {
    tasks: "จัดการและติดตามงานทั้งหมดในทีม",
    meetings: "รายการการประชุมและบันทึกการประชุม",
    calendar: "ตารางงานและการประชุมทั้งหมด",
    users: "จัดการผู้ใช้งานและสิทธิ์การเข้าถึง",
    dashboard: "ภาพรวมและสถิติการทำงาน",
    account: "ตั้งค่าโปรไฟล์และข้อมูลส่วนตัว",
    settings: "ตั้งค่าระบบและการกำหนดค่า",
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative z-30 flex flex-col h-full w-60 flex-shrink-0 transition-transform duration-300",
          "md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{ background: "oklch(0.2 0.04 255)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">MYD Studio</p>
            <p className="text-slate-400 text-xs">Team Workspace</p>
          </div>
          <button
            className="ml-auto md:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
            เมนูหลัก
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left",
                  isActive
                    ? "bg-blue-500/20 text-blue-300 font-semibold"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </button>
            );
          })}

          {/* System section */}
          <div className="pt-4">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
              ระบบ
            </p>
            {systemItems
              .filter((item) => !item.adminOnly || currentUser.companyRole === "admin")
              .map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left",
                      isActive
                        ? "bg-blue-500/20 text-blue-300 font-semibold"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                  </button>
                );
              })}
          </div>
        </nav>

        {/* User info */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <button
              onClick={() => { navigate("/ae/account"); setSidebarOpen(false); }}
              className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
            >
              {currentUser.profilePhoto ? (
                <img src={currentUser.profilePhoto} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                  currentUser.avatarColor || "bg-blue-500"
                )}>
                  {currentUser.avatarInitials || currentUser.name?.slice(0, 2)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-slate-500 text-xs">
                  {currentUser.companyRole === "admin" ? "Admin" : currentUser.companyRole === "head" ? "Head" : "AE"}
                </p>
              </div>
            </button>
            <button
              className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
              onClick={handleLogout}
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-border flex-shrink-0">
          <button
            className="md:hidden text-slate-500 hover:text-slate-700 flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-foreground truncate">
              {TAB_TITLES[activeTab]}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm truncate hidden sm:block">
              {TAB_SUBTITLES[activeTab]}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {activeTab === "tasks" && <TasksTab currentUser={currentUser} />}
          {activeTab === "meetings" && <MeetingsTab currentUser={currentUser} />}
          {activeTab === "calendar" && <CalendarTab />}
          {activeTab === "users" && (
            currentUser.companyRole === "admin"
              ? <UserManagementContent />
              : <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">คุณไม่มีสิทธิ์เข้าถึงส่วนนี้</div>
          )}
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "account" && (
            <AccountSettingsTab
              user={currentUser}
              onUpdate={(updatedUser) => { if (updatedUser) setCurrentUser(updatedUser as AppUser); }}
            />
          )}
          {activeTab === "settings" && (
            currentUser.companyRole === "admin"
              ? <SystemSettingsTab />
              : <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">คุณไม่มีสิทธิ์เข้าถึงส่วนนี้</div>
          )}
        </main>
      </div>
    </div>
  );
}
