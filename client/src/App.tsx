import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DatabaseProvider } from "./contexts/DatabaseContext";
import AEPortal from "./pages/AEPortal";
import CustomerPortal from "./pages/CustomerPortal";
import TaskDetailPage from "./pages/TaskDetailPage";
import LoginPage from "./pages/LoginPage";
import UserManagementPage from "./pages/UserManagementPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/ae" component={AEPortal} />
      <Route path="/ae/tasks" component={AEPortal} />
      <Route path="/ae/crm" component={AEPortal} />
      <Route path="/ae/customers" component={AEPortal} />
      <Route path="/ae/cash" component={AEPortal} />
      <Route path="/ae/users" component={AEPortal} />
      <Route path="/ae/task/:taskId" component={TaskDetailPage} />
      <Route path="/customer/:customerId" component={CustomerPortal} />
      <Route path="/customer/:customerId/task/:taskId" component={CustomerPortal} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <DatabaseProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </DatabaseProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
