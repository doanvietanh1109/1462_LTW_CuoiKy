import React, { Suspense, lazy, useLayoutEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { PublicLayout } from "./components/layouts/PublicLayout";
import { LandlordLayout } from "./components/layouts/LandlordLayout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
const GuestHomePage = lazy(() => import("./pages/GuestHomePage").then((m) => ({ default: m.GuestHomePage })));
const SearchPage = lazy(() => import("./pages/SearchPage").then((m) => ({ default: m.SearchPage })));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage").then((m) => ({ default: m.BookmarksPage })));
const ComparePage = lazy(() => import("./pages/ComparePage").then((m) => ({ default: m.ComparePage })));
const RoomDetailPage = lazy(() => import("./pages/RoomDetailPage").then((m) => ({ default: m.RoomDetailPage })));
const InvoiceDetailPage = lazy(() => import("./pages/InvoiceDetailPage").then((m) => ({ default: m.InvoiceDetailPage })));
const TenantPortalPage = lazy(() => import("./pages/TenantPortalPage").then((m) => ({ default: m.TenantPortalPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })));
const LandlordDashboardPage = lazy(() => import("./pages/landlord/LandlordDashboardPage").then((m) => ({ default: m.LandlordDashboardPage })));
const LandlordBlocksPage = lazy(() => import("./pages/landlord/LandlordBlocksPage").then((m) => ({ default: m.LandlordBlocksPage })));
const LandlordRoomsPage = lazy(() => import("./pages/landlord/LandlordRoomsPage").then((m) => ({ default: m.LandlordRoomsPage })));
const LandlordContractsPage = lazy(() => import("./pages/landlord/LandlordContractsPage").then((m) => ({ default: m.LandlordContractsPage })));
const LandlordMetersPage = lazy(() => import("./pages/landlord/LandlordMetersPage").then((m) => ({ default: m.LandlordMetersPage })));
const LandlordInvoicesPage = lazy(() => import("./pages/landlord/LandlordInvoicesPage").then((m) => ({ default: m.LandlordInvoicesPage })));
const LandlordRepairsPage = lazy(() => import("./pages/landlord/LandlordRepairsPage").then((m) => ({ default: m.LandlordRepairsPage })));
const LandlordContactsPage = lazy(() => import("./pages/landlord/LandlordContactsPage").then((m) => ({ default: m.LandlordContactsPage })));

export const App = () => {
  const location = useLocation();

  // Đồng bộ 100% các file CSS được bật theo đúng từng trang HTML gốc của thư mục frontend
  useLayoutEffect(() => {
    const p = location.pathname;
    const isLandlord = p.startsWith("/landlord");
    const isAdmin = p.startsWith("/admin");
    const isPublic = !isLandlord && !isAdmin;

    const setSheet = (id, enabled) => {
      const el = document.getElementById(id);
      if (el) el.disabled = !enabled;
    };

    setSheet("css-base", true);
    setSheet("css-components", true);
    setSheet("css-layout", isPublic);
    setSheet("css-chatbot", isPublic);

    setSheet(
      "css-index",
      p === "/" ||
        p.startsWith("/tenant") ||
        p.startsWith("/invoices") ||
        p.startsWith("/login")
    );
    setSheet(
      "css-search",
      p.startsWith("/search") || p.startsWith("/bookmarks")
    );
    setSheet("css-detail", p.startsWith("/rooms/"));
    setSheet("css-compare", p.startsWith("/compare"));

    setSheet("css-admin", isLandlord);
    setSheet("css-landlord", isLandlord);
    setSheet("css-tenant-modal", isLandlord);

    setSheet("css-admin-dashboard", isAdmin);
  }, [location.pathname]);

  return (
    <Suspense fallback={<div className="text-center py-5" role="status">Đang tải trang...</div>}>
    <Routes>
      {/* Nested Routes cho Khách & Người thuê (<PublicLayout /> có <Outlet />) */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<GuestHomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="bookmarks" element={<BookmarksPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="rooms/:id" element={<RoomDetailPage />} />
        <Route path="login" element={<LoginPage />} />

        {/* Route bảo vệ cho Người thuê */}
        <Route
          path="tenant/my-room"
          element={
            <ProtectedRoute allowedRoles={["user", "landlord", "admin"]}>
              <TenantPortalPage />
            </ProtectedRoute>
          }
        />

        {/* Dynamic route xem chi tiết hóa đơn & Xuất PDF */}
        <Route
          path="invoices/:id"
          element={
            <ProtectedRoute allowedRoles={["user", "landlord", "admin"]}>
              <InvoiceDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Trang 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Trang Quản trị Admin (giống hệt admin.html) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Nested Routes cho Chủ trọ (<LandlordLayout /> có <Outlet />, bảo vệ bằng <ProtectedRoute />) */}
      <Route
        path="/landlord"
        element={
          <ProtectedRoute allowedRoles={["landlord", "admin"]}>
            <LandlordLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/landlord/dashboard" replace />} />
        <Route path="dashboard" element={<LandlordDashboardPage />} />
        <Route path="blocks" element={<LandlordBlocksPage />} />
        <Route path="rooms" element={<LandlordRoomsPage />} />
        <Route path="contracts" element={<LandlordContractsPage />} />
        <Route path="meters" element={<LandlordMetersPage />} />
        <Route path="invoices" element={<LandlordInvoicesPage />} />
        <Route path="repairs" element={<LandlordRepairsPage />} />
        <Route path="contacts" element={<LandlordContactsPage />} />
      </Route>
    </Routes>
    </Suspense>
  );
};

export default App;
