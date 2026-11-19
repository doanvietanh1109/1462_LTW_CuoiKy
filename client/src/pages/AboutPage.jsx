import React from "react";
import { Link } from "react-router-dom";
import "../styles/public-pages.css";

const tenantFeatures = [
  ["bi-search", "Tìm phòng theo nhu cầu", "Tìm theo khu vực, diện tích, mức giá và các tiện nghi bạn quan tâm."],
  ["bi-card-image", "Xem thông tin phòng", "Tham khảo hình ảnh, mô tả, giá thuê và tình trạng phòng trước khi liên hệ."],
  ["bi-file-earmark-text", "Theo dõi hợp đồng và hóa đơn", "Xem thông tin thuê, các khoản phí, hóa đơn và trạng thái thanh toán trong cổng người thuê."],
  ["bi-bell", "Nhận thông báo và gửi yêu cầu", "Theo dõi thông báo liên quan đến tài khoản và gửi yêu cầu sửa chữa khi cần hỗ trợ."],
];

const landlordFeatures = [
  ["bi-houses", "Quản lý phòng và khách thuê", "Theo dõi phòng, tình trạng cho thuê và thông tin người thuê trong hệ thống."],
  ["bi-file-earmark-check", "Quản lý hợp đồng", "Tạo, cập nhật và theo dõi các hợp đồng gắn với phòng thuê."],
  ["bi-speedometer2", "Ghi chỉ số điện nước", "Ghi chỉ số theo kỳ và dùng dữ liệu đã ghi để lập hóa đơn."],
  ["bi-receipt", "Theo dõi hóa đơn và thanh toán", "Phát hành hóa đơn, theo dõi công nợ và xử lý yêu cầu xác nhận thanh toán."],
  ["bi-tools", "Tiếp nhận yêu cầu sửa chữa", "Theo dõi các yêu cầu sửa chữa liên quan đến phòng đang quản lý."],
];

const steps = [
  ["01", "Tìm phòng phù hợp", "Lọc danh sách theo khu vực, giá, diện tích và tiện nghi để thu hẹp lựa chọn."],
  ["02", "Xem thông tin và liên hệ", "Đọc chi tiết phòng, trao đổi các điều kiện thuê và thống nhất thời điểm xem phòng."],
  ["03", "Hoàn thiện thỏa thuận thuê", "Hai bên xác nhận thông tin phòng, thời hạn, tiền thuê và các khoản phí trước khi bắt đầu thuê."],
  ["04", "Theo dõi quá trình thuê", "Người thuê xem hóa đơn, thông báo và gửi yêu cầu hỗ trợ; chủ trọ quản lý phòng và xử lý nghiệp vụ liên quan."],
];

const FeatureGroup = ({ title, description, items, icon }) => (
  <section className="public-feature-group">
    <div className="public-section-heading">
      <span className="public-eyebrow"><i className={`bi ${icon}`} aria-hidden="true"/> {title}</span>
      <p>{description}</p>
    </div>
    <div className="public-feature-grid">
      {items.map(([itemIcon, heading, copy]) => (
        <article className="public-feature-card" key={heading}>
          <span className="public-feature-icon"><i className={`bi ${itemIcon}`} aria-hidden="true"/></span>
          <h3>{heading}</h3>
          <p>{copy}</p>
        </article>
      ))}
    </div>
  </section>
);

export const AboutPage = () => (
  <main className="public-info-page about-page">
    <section className="public-hero about-hero">
      <div className="public-page-container about-hero-inner">
        <div className="about-hero-copy">
          <span className="public-eyebrow"><i className="bi bi-house-heart" aria-hidden="true"/> TÌM VÀ QUẢN LÝ PHÒNG TRỌ</span>
          <h1>RIPT Rental – Kết nối người thuê và chủ trọ</h1>
          <p>RIPT Rental tập hợp thông tin phòng trọ và các công cụ quản lý thuê trong một nơi, giúp người thuê dễ tìm lựa chọn phù hợp và giúp chủ trọ theo dõi công việc hằng tháng.</p>
          <Link to="/search" className="btn btn-primary public-primary-button">Khám phá phòng trọ <i className="bi bi-arrow-right" aria-hidden="true"/></Link>
        </div>
        <div className="about-hero-art" aria-hidden="true">
          <div className="about-art-window"><span/><span/><span/><span/></div>
          <div className="about-art-card"><i className="bi bi-house-check-fill"/><span>Không gian phù hợp<br/>cho hành trình mới</span></div>
        </div>
      </div>
    </section>

    <div className="public-page-container public-page-sections">
      <section className="public-intro-section">
        <div>
          <span className="public-eyebrow">RIPT RENTAL LÀ GÌ?</span>
          <h2>Một hành trình thuê trọ rõ ràng hơn</h2>
        </div>
        <div className="public-intro-copy">
          <p>Nền tảng hỗ trợ người thuê tìm kiếm và xem thông tin phòng, đồng thời kết nối các bước quản lý sau khi thuê. Chủ trọ có thể quản lý phòng, hợp đồng, chỉ số điện nước, hóa đơn và yêu cầu sửa chữa trong cùng hệ thống.</p>
          <p>Các thông tin và trạng thái hiển thị dựa trên dữ liệu được cập nhật trong RIPT Rental. Người thuê và chủ trọ vẫn cần trao đổi, xác nhận các điều khoản thuê và đối chiếu giao dịch thực tế với nhau.</p>
        </div>
      </section>

      <FeatureGroup title="Dành cho người thuê" description="Tìm phòng, theo dõi thông tin thuê và chủ động gửi yêu cầu hỗ trợ." items={tenantFeatures} icon="bi-person"/>
      <FeatureGroup title="Dành cho chủ trọ" description="Các công cụ vận hành phòng trọ và theo dõi nghiệp vụ theo kỳ." items={landlordFeatures} icon="bi-buildings"/>

      <section className="public-process-section">
        <div className="public-section-heading public-section-heading-center">
          <span className="public-eyebrow">BẮT ĐẦU TỪ NHU CẦU CỦA BẠN</span>
          <h2>Các bước trong quá trình thuê</h2>
          <p>Từ lúc tìm phòng đến khi theo dõi các khoản trong thời gian thuê.</p>
        </div>
        <ol className="public-process-grid">
          {steps.map(([number, heading, copy]) => (
            <li className="public-process-card" key={number}>
              <span>{number}</span><h3>{heading}</h3><p>{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="public-cta">
        <div><span className="public-eyebrow">SẴN SÀNG TÌM PHÒNG?</span><h2>Bắt đầu với những lựa chọn phù hợp</h2><p>Dùng bộ lọc để xem các phòng đang được đăng trên RIPT Rental.</p></div>
        <Link to="/search" className="btn btn-light public-cta-button">Tìm phòng ngay <i className="bi bi-arrow-right" aria-hidden="true"/></Link>
      </section>
    </div>
  </main>
);
