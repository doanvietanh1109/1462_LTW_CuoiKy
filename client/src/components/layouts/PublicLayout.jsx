import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "../common/Header";
import { Footer } from "../common/Footer";
import { AuthModal } from "../auth/AuthModal";
import { ChatbotWidget } from "../common/ChatbotWidget";

// Nested Route Layout cho Khách & Người thuê có sử dụng <Outlet />
export const PublicLayout = () => {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
      <AuthModal />
      <ChatbotWidget />
    </>
  );
};
