import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CompaniesPage from "./pages/CompaniesPage";
import TrainingsPage from "./pages/TrainingsPage";
import SessionsPage from "./pages/SessionsPage";
import StatisticsPage from "./pages/StatisticsPage";
import DevicesPage from "./pages/DevicesPage";
import AdminLayout from "./components/AdminLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/trainings" element={<TrainingsPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
