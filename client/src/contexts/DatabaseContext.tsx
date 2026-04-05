import React, { createContext, useContext, useEffect, useState } from "react";
import { db, Customer, Task, CashCollection, PaymentStatus, TaskStatus, SystemSettings } from "@/lib/database";

interface DatabaseContextValue {
  customers: Customer[];
  tasks: Task[];
  settings: SystemSettings;
  refresh: () => void;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  customers: [],
  tasks: [],
  settings: { companyName: "", mediaItems: [], productItems: [] },
  refresh: () => {},
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(db.getCustomers());
  const [tasks, setTasks] = useState<Task[]>(db.getTasks());
  const [settings, setSettings] = useState<SystemSettings>(db.getSettings());

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setCustomers([...db.getCustomers()]);
      setTasks([...db.getTasks()]);
      setSettings({ ...db.getSettings() });
    });
    return unsubscribe;
  }, []);

  const refresh = () => {
    setCustomers([...db.getCustomers()]);
    setTasks([...db.getTasks()]);
    setSettings({ ...db.getSettings() });
  };

  return (
    <DatabaseContext.Provider value={{ customers, tasks, settings, refresh }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
