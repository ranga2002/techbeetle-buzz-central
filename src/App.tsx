
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import AuthPage from "./components/auth/AuthPage";
import NewsPage from "./pages/NewsPage";
import ReviewsPage from "./pages/ReviewsPage";
import VideosPage from "./pages/VideosPage";
import HowToPage from "./pages/HowToPage";
import ComparePage from "./pages/ComparePage";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ContentManagement from "./pages/admin/ContentManagement";
import UserManagement from "./pages/admin/UserManagement";
import CommentsManagement from "./pages/admin/CommentsManagement";
import CategoriesManagement from "./pages/admin/CategoriesManagement";
import TagsManagement from "./pages/admin/TagsManagement";
import AnalyticsManagement from "./pages/admin/AnalyticsManagement";
import SettingsManagement from "./pages/admin/SettingsManagement";
import NewsApiTest from "./pages/admin/NewsApiTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="techbeetle-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/videos" element={<VideosPage />} />
              <Route path="/how-to" element={<HowToPage />} />
              <Route path="/compare" element={<ComparePage />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="content" element={<ContentManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="comments" element={<CommentsManagement />} />
                <Route path="categories" element={<CategoriesManagement />} />
                <Route path="tags" element={<TagsManagement />} />
                <Route path="analytics" element={<AnalyticsManagement />} />
                <Route path="settings" element={<SettingsManagement />} />
                <Route path="news-test" element={<NewsApiTest />} />
              </Route>
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
