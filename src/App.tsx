import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/MainLayout";
import { AuthProvider } from "./contexts/AuthContext";

const Landing = lazy(() => import("./pages/Landing"));
const Index = lazy(() => import("./pages/Index"));
const Leads = lazy(() => import("./pages/Leads"));
const Settings = lazy(() => import("./pages/Settings"));
const Automation = lazy(() => import("./pages/Automation"));
const Tutorial = lazy(() => import("./pages/Tutorial"));
const Login = lazy(() => import("./pages/Login"));
const ConversionDashboard = lazy(() => import("./pages/ConversionDashboard"));
const FinanceDashboard = lazy(() => import("./pages/FinanceDashboard"));
const WarRoom = lazy(() => import("./pages/WarRoom"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<MainLayout />}>
                <Route path="/" element={<ConversionDashboard />} />
                <Route path="/radar" element={<Index />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/conversion" element={<ConversionDashboard />} />
                <Route path="/finance" element={<FinanceDashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/automation" element={<Automation />} />
                <Route path="/war-room" element={<WarRoom />} />
                <Route path="/tutorial" element={<Tutorial />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
