import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AEPortal from "./pages/AEPortal";
import LoginPage from "./pages/LoginPage";
import UserManagementPage from "./pages/UserManagementPage";
import ItemDetailPage from "./pages/ItemDetailPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/ae" component={AEPortal} />
      <Route path="/ae/dashboard" component={AEPortal} />
      <Route path="/ae/tasks" component={AEPortal} />
      <Route path="/ae/meetings" component={AEPortal} />
      <Route path="/ae/calendar" component={AEPortal} />
      <Route path="/ae/users" component={AEPortal} />
      <Route path="/ae/account" component={AEPortal} />
      <Route path="/ae/settings" component={AEPortal} />
      <Route path="/ae/item/:itemId" component={ItemDetailPage} />
      <Route path="/users" component={UserManagementPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
