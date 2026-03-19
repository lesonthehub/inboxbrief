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
import { DisclaimerModal, useDisclaimerStatus } from "./components/DisclaimerModal";

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
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithDisclaimer() {
  const { accepted, loading, markAccepted } = useDisclaimerStatus();

  return (
    <>
      {/* Show disclaimer modal until accepted. Loading state shows nothing to avoid flash. */}
      {!loading && !accepted && (
        <DisclaimerModal onAccepted={markAccepted} />
      )}
      <Router />
    </>
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
          <AppWithDisclaimer />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
