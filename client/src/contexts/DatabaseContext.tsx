import React, { createContext, useContext, useEffect, useState } from "react";
import { db, Customer, Task, CashCollection, PaymentStatus, TaskStatus } from "@/lib/database";

interface DatabaseContextValue {
  customers: Customer[];
  tasks: Task[];
  refresh: () => void;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  customers: [],
  tasks: [],
  refresh: () => {},
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(db.getCustomers());
  const [tasks, setTasks] = useState<Task[]>(db.getTasks());

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setCustomers([...db.getCustomers()]);
      setTasks([...db.getTasks()]);
    });
    return unsubscribe;
  }, []);

  const refresh = () => {
    setCustomers([...db.getCustomers()]);
    setTasks([...db.getTasks()]);
  };

  return (
    <DatabaseContext.Provider value={{ customers, tasks, refresh }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
