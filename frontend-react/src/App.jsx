import React, { useLayoutEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { PublicLayout } from "./components/layouts/PublicLayout";
import { LandlordLayout } from "./components/layouts/LandlordLayout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { GuestHomePage } from "./pages/GuestHomePage";
import { SearchPage } from "./pages/SearchPage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { ComparePage } from "./pages/ComparePage";
import { RoomDetailPage } from "./pages/RoomDetailPage";
import { InvoiceDetailPage } from "./pages/InvoiceDetailPage";
import { TenantPortalPage } from "./pages/TenantPortalPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { LandlordDashboardPage } from "./pages/landlord/LandlordDashboardPage";
import { LandlordBlocksPage } from "./pages/landlord/LandlordBlocksPage";
import { LandlordRoomsPage } from "./pages/landlord/LandlordRoomsPage";
import { LandlordContractsPage } from "./pages/landlord/LandlordContractsPage";
import { LandlordMetersPage } from "./pages/landlord/LandlordMetersPage";
import { LandlordInvoicesPage } from "./pages/landlord/LandlordInvoicesPage";
import { LandlordRepairsPage } from "./pages/landlord/LandlordRepairsPage";
import { LandlordContactsPage } from "./pages/landlord/LandlordContactsPage";

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
  );
};

export default App;
