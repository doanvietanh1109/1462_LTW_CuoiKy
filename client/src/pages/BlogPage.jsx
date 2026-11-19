import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { blogCategories, blogPosts, normalizeBlogText } from "../data/blogPosts";
import "../styles/public-pages.css";

const formatPublishedDate = (value) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`));

export const BlogPage = () => {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  const visiblePosts = useMemo(() => {
    const query = normalizeBlogText(searchText.trim());
    return blogPosts.filter((post) => {
      const matchesCategory = selectedCategory === "Tất cả" || post.category === selectedCategory;
      const searchableText = normalizeBlogText([
        post.title,
        post.category,
        post.excerpt,
        post.introduction,
        ...post.sections.flatMap((section) => [section.heading, ...section.paragraphs, ...(section.bullets || [])]),
      ].join(" "));
      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [searchText, selectedCategory]);

  return (
    <main className="public-info-page blog-page">
      <section className="public-hero blog-hero">
        <div className="public-page-container">
          <span className="public-eyebrow"><i className="bi bi-journal-richtext" aria-hidden="true"/> KIẾN THỨC THUÊ VÀ QUẢN LÝ NHÀ TRỌ</span>
          <h1>Cẩm nang thuê trọ</h1>
          <p>Những hướng dẫn thực tế giúp bạn chuẩn bị khi xem phòng, hiểu các khoản phí và theo dõi quá trình thuê.</p>
          <div className="blog-search-wrap">
            <i className="bi bi-search" aria-hidden="true"/>
            <label className="visually-hidden" htmlFor="blog-search">Tìm bài viết</label>
            <input id="blog-search" type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Tìm theo chủ đề hoặc từ khóa…" />
            {searchText && <button type="button" aria-label="Xóa từ khóa tìm kiếm" onClick={() => setSearchText("")}><i className="bi bi-x-lg" aria-hidden="true"/></button>}
          </div>
        </div>
      </section>

      <div className="public-page-container blog-content">
        <div className="blog-category-bar" role="group" aria-label="Lọc bài viết theo danh mục">
          {["Tất cả", ...blogCategories].map((category) => (
            <button type="button" key={category} className={selectedCategory === category ? "is-active" : ""} aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)}>{category}</button>
          ))}
        </div>
        <div className="blog-results-heading"><h2>{searchText || selectedCategory !== "Tất cả" ? "Kết quả phù hợp" : "Bài viết mới"}</h2><span>{visiblePosts.length} bài viết</span></div>

        {visiblePosts.length ? (
          <div className="blog-card-grid">
            {visiblePosts.map((post) => (
              <article className="blog-card" key={post.slug}>
                <Link to={`/blog/${post.slug}`} className="blog-card-image-link" aria-label={`Đọc ${post.title}`}>
                  <img src={post.image} alt={post.imageAlt} loading="lazy"/>
                  <span className="blog-card-category">{post.category}</span>
                </Link>
                <div className="blog-card-body">
                  <time dateTime={post.publishedAt}><i className="bi bi-calendar3" aria-hidden="true"/> {formatPublishedDate(post.publishedAt)}</time>
                  <h3><Link to={`/blog/${post.slug}`}>{post.title}</Link></h3>
                  <p>{post.excerpt}</p>
                  <Link to={`/blog/${post.slug}`} className="blog-read-more">Đọc thêm <i className="bi bi-arrow-right" aria-hidden="true"/></Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="blog-empty-state" role="status">
            <span><i className="bi bi-journal-x" aria-hidden="true"/></span>
            <h2>Chưa tìm thấy bài viết phù hợp</h2>
            <p>Thử từ khóa khác hoặc xem toàn bộ cẩm nang thuê trọ.</p>
            <button type="button" className="btn btn-outline-primary" onClick={() => { setSearchText(""); setSelectedCategory("Tất cả"); }}>Hiển thị tất cả bài viết</button>
          </section>
        )}
      </div>
    </main>
  );
};
