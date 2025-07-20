import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import AdminLogin from "@/pages/AdminLogin";
import ApplicantLogin from "@/pages/ApplicantLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import SortingPage from "@/pages/SortingPage";
import MessagesInterviewsPage from "@/pages/MessagesInterviewsPage";
import CVDetail from "@/pages/CVDetail";
import ClientDashboard from "@/pages/ClientDashboard";
import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/toaster";
import SettingsPage from "@/pages/SettingsPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/applicant/login" element={<ApplicantLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/sorting" element={<SortingPage />} />
          <Route path="/admin/messages" element={<MessagesInterviewsPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="/admin/cv/:id" element={<CVDetail />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
