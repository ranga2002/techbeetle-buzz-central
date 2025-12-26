import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import AuthPage from "./components/auth/AuthPage";
import NewsPage from "./pages/NewsPage";
import ReviewsPage from "./pages/ReviewsPage";
const ReviewDetailPage = lazy(() => import("./pages/ReviewDetailPage"));
import VideosPage from "./pages/VideosPage";
import HowToPage from "./pages/HowToPage";
import ComparePage from "./pages/ComparePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
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
import NewsApiTest from "./pages/admin/NewsApiTest";
import ReadingHistoryPage from "@/pages/ReadingHistoryPage";
import ReviewGeneration from "./pages/admin/ReviewGeneration";
import ProductManagement from "./pages/admin/ProductManagement";
import ProductScraperPage from "./pages/admin/ProductScraperPage";
import InventoryManagement from "./pages/admin/InventoryManagement";
import SiteSettingsManagement from "./pages/admin/SiteSettingsManagement";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import NewsEditor from "./pages/admin/NewsEditor";
import SeoAnalytics from "./pages/admin/SeoAnalytics";
import { GlobalSeo } from "./components/GlobalSeo";
import ProfilePage from "./pages/ProfilePage";
import EditorLayout from "./components/admin/EditorLayout";
import ContactPage from "./pages/ContactPage";
import ConsentBanner from "./components/ConsentBanner";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="techbeetle-theme">
      <HelmetProvider>
        <TooltipProvider>
          <GlobalSeo />
          <ConsentBanner />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<div className="p-6 text-center text-muted-foreground">Loading…</div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/news/:slug" element={<NewsPage />} />
                  <Route path="/reviews" element={<ReviewsPage />} />
                  <Route path="/reviews/:slug" element={<ReviewDetailPage />} />
                  <Route path="/videos" element={<VideosPage />} />
                  <Route path="/how-to" element={<HowToPage />} />
                  <Route path="/compare" element={<ComparePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:slug" element={<ProductDetailPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/bookmarks" element={<BookmarksPage />} />
                  <Route path="/preferences" element={<PreferencesPage />} />
                  <Route path="/reading-history" element={<ReadingHistoryPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                      
                  {/* Editor Routes */}
                  <Route path="/editor" element={<EditorLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="analytics" element={<AnalyticsManagement />} />
                    <Route path="content" element={<ContentManagement />} />
                    <Route path="categories" element={<CategoriesManagement />} />
                    <Route path="tags" element={<TagsManagement />} />
                    <Route path="products" element={<InventoryManagement />} />
                    <Route path="review-management" element={<ProductManagement />} />
                    <Route path="news-editor" element={<NewsEditor />} />
                    <Route path="settings" element={<SettingsManagement />} />
                    <Route path="site-settings" element={<SiteSettingsManagement />} />
                  </Route>

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
                    <Route path="news-test" element={<NewsApiTest />} />
                    <Route path="news-editor" element={<NewsEditor />} />
                    <Route path="review-generator" element={<ReviewGeneration />} />
                    <Route path="product-management" element={<ProductManagement />} />
                    <Route path="product-scraper" element={<ProductScraperPage />} />
                    <Route path="inventory" element={<InventoryManagement />} />
                    <Route path="seo" element={<SeoAnalytics />} />
                  </Route>
                    
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
