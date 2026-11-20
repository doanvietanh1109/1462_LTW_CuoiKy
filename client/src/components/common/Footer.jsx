import React from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";

const exploreLinks = [
  ["Trang chủ", "/"],
  ["Tìm phòng", "/search"],
  ["Đã lưu", "/bookmarks"],
  ["Giới thiệu", "/about"],
  ["Cẩm nang thuê trọ", "/blog"],
];

export const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <div className="site-footer__main">
        <section className="site-footer__brand" aria-label="Về RIPT Rental">
          <BrandLogo variant="dark" className="site-footer__brand-logo" />
          <p className="site-footer__slogan">Tìm phòng dễ dàng. Thuê trọ an tâm.</p>
          <p className="site-footer__description">
            Nền tảng kết nối người tìm trọ và chủ nhà, giúp việc tìm kiếm và quản lý
            phòng trở nên thuận tiện hơn.
          </p>
          <a
            href="https://web.facebook.com/oanvietanhspike/?locale=vi_VN"
            target="_blank"
            rel="noreferrer"
            className="site-footer__social"
            aria-label="RIPT Rental trên Facebook (mở tab mới)"
          >
            <i className="bi bi-facebook" aria-hidden="true" />
            <span>Facebook</span>
          </a>
        </section>

        <nav className="site-footer__column" aria-label="Khám phá">
          <h2 className="site-footer__heading">Khám phá</h2>
          <ul>
            {exploreLinks.map(([label, to]) => (
              <li key={to}><Link to={to}>{label}</Link></li>
            ))}
          </ul>
        </nav>

        <nav className="site-footer__column" aria-label="Hỗ trợ">
          <h2 className="site-footer__heading">Hỗ trợ</h2>
          <ul>
            <li><Link to="/contact">Liên hệ</Link></li>
          </ul>
        </nav>
      </div>

      <div className="site-footer__bottom">
        <p>© {new Date().getFullYear()} RIPT Rental. Bảo lưu mọi quyền.</p>
        <p className="site-footer__bottom-note">Tìm nơi ở phù hợp, an tâm bắt đầu.</p>
      </div>
    </div>
  </footer>
);
