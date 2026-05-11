import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Enterprise from "./pages/Enterprise";
import AcceptInvite from "./pages/AcceptInvite";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminCustomers from "./pages/AdminCustomers";
import AdminTools from "./pages/AdminTools";
import SmsOptIn from "./pages/SmsOptIn";
import { DisclaimerBanner } from "./components/DisclaimerModal";
import { AnnouncementBanner } from "./components/AnnouncementBanner";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/enterprise" component={Enterprise} />
      <Route path="/invite/:token" component={AcceptInvite} />
      <Route path="/admin/announcements" component={AdminAnnouncements} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/tools" component={AdminTools} />
      <Route path="/sms-opt-in" component={SmsOptIn} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.16 0.018 264)",
                border: "1px solid oklch(0.25 0.020 264)",
                color: "oklch(0.97 0.005 264)",
              },
            }}
          />
          {/*
            DisclaimerBanner wraps all content.
            - First-time visitors (not logged in, no localStorage flag) see the checkbox banner
            - Logged-in users pass through immediately
            - Once accepted, localStorage flag prevents it from ever showing again
          */}
          <DisclaimerBanner>
            <AnnouncementBanner />
            <Router />
          </DisclaimerBanner>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
