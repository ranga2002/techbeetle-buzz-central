import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import AuthPage from "./components/auth/AuthPage";
import ReviewsPage from "./pages/ReviewsPage";
import VideosPage from "./pages/VideosPage";
import HowToPage from "./pages/HowToPage";
import ComparePage from "./pages/ComparePage";
import ProductsPage from "./pages/ProductsPage";
import SearchPage from "./pages/SearchPage";
import BookmarksPage from "./pages/BookmarksPage";
import PreferencesPage from "./pages/PreferencesPage";
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
import ReadingHistoryPage from "@/pages/ReadingHistoryPage";
import ReviewGeneration from "./pages/admin/ReviewGeneration";
import ProductManagement from "./pages/admin/ProductManagement";
import SiteSettingsManagement from "./pages/admin/SiteSettingsManagement";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import ContentPage from "./pages/ContentPage";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="techbeetle-theme">
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
                <Route path="/videos" element={<VideosPage />} />
                <Route path="/how-to" element={<HowToPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/news/*" element={<Navigate to="/" replace />} />
                <Route path="/bookmarks" element={<BookmarksPage />} />
                <Route path="/preferences" element={<PreferencesPage />} />
                <Route path="/reading-history" element={<ReadingHistoryPage />} />
                <Route path="/content/:slug" element={<ContentPage />} />

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
                  <Route path="site-settings" element={<SiteSettingsManagement />} />
                  <Route path="review-generator" element={<ReviewGeneration />} />
                  <Route path="product-scraper" element={<ProductManagement />} />
                </Route>

                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsPage />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
