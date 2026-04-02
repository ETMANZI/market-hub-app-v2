import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ListingsPage from "../pages/ListingsPage";
import ListingDetailsPage from "../pages/ListingDetailsPage";
import PublishListingPage from "../pages/PublishListingPage";
import DashboardPage from "../pages/DashboardPage";
import AdminModerationPage from "../pages/AdminModerationPage";
import EditListingPage from "../pages/EditListingPage";
import ProfilePage from "../pages/ProfilePage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import PromoBannerAdminPage from "../pages/PromoBannerAdminPage";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Navigate to="/listings" replace /> },
      { path: "/listings", element: <ListingsPage /> },
      { path: "/listings/:id", element: <ListingDetailsPage /> },
      { path: "/listings/:id/edit", element: <EditListingPage /> },
      { path: "/publish", element: <PublishListingPage /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/admin/moderation", element: <AdminModerationPage /> },
      { path: "/profile", element: <ProfilePage />},
      { path: "/forgot-password", element: <ForgotPasswordPage />},
      { path: "/reset-password/:uid/:token", element: <ResetPasswordPage />},
      { path: "/admin/promo-banners", element: <PromoBannerAdminPage />}
    ],
  },

  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
]);