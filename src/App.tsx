import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./lib/auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import CompanyLayout from "./components/CompanyLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import DevicesPage from "./pages/DevicesPage";
import SessionsPage from "./pages/SessionsPage";
import TrainingsPage from "./pages/TrainingsPage";
import QuizPage from "./pages/QuizPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<LoginPage />} />
            <Route element={<ProtectedRoute><CompanyLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/trainings" element={<TrainingsPage />} />
              <Route path="/trainings/:trainingId/quiz" element={<QuizPage />} />
            </Route>
          </Routes>
          <Toaster richColors position="top-right" theme="dark" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
