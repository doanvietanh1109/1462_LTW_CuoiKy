import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandLogo } from "../components/common/BrandLogo";
import { blogCategories, blogPosts, filterBlogPosts, getBlogReadingMinutes, getValidBlogDate } from "../data/blogPosts";
import "../styles/public-pages.css";

const formatPublishedDate = (value) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`));

export const BlogPage = () => {
  const [searchText, setSearchText] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCategory = searchParams.get("category");
  const initialCategory = blogCategories.some((category) => category.slug === requestedCategory) ? requestedCategory : "all";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("curated");
  const [visibleCount, setVisibleCount] = useState(7);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Cẩm nang thuê trọ | RIPT Rental";
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    setSelectedCategory(blogCategories.some((category) => category.slug === requestedCategory) ? requestedCategory : "all");
    setVisibleCount(7);
  }, [requestedCategory]);

  const visiblePosts = useMemo(() => filterBlogPosts(blogPosts, { query: searchText, categorySlug: selectedCategory, sortBy }), [searchText, selectedCategory, sortBy]);

  const featuredPost = visiblePosts[0];
  const listedPosts = visiblePosts.slice(1, visibleCount);
  const changeCategory = (slug) => {
    setSelectedCategory(slug);
    setSearchParams(slug === "all" ? {} : { category: slug });
    setVisibleCount(7);
  };

  const postLink = (post) => `/blog/${post.slug}`;
  const articleMeta = (post) => (
    <span className="blog-reading-meta"><i className="bi bi-clock" aria-hidden="true"/> {getBlogReadingMinutes(post)} phút đọc</span>
  );
  const publishedDateMeta = (post) => getValidBlogDate(post.publishedAt) ? <time dateTime={post.publishedAt}><i className="bi bi-calendar3" aria-hidden="true"/> {formatPublishedDate(post.publishedAt)}</time> : null;

  return (
    <main className="public-info-page blog-page">
      <section className="public-hero blog-hero">
        <div className="public-page-container">
          <nav className="blog-breadcrumb" aria-label="Đường dẫn">
            <Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">Cẩm nang thuê trọ</span>
          </nav>
          <span className="public-eyebrow"><i className="bi bi-journal-richtext" aria-hidden="true"/> GÓC KIẾN THỨC RIPT RENTAL</span>
          <h1>Cẩm nang thuê trọ</h1>
          <p>Kiến thức và kinh nghiệm giúp bạn tìm phòng an toàn, thuê trọ thông minh và tiết kiệm chi phí.</p>
          <div className="blog-search-wrap">
            <i className="bi bi-search" aria-hidden="true"/>
            <label className="visually-hidden" htmlFor="blog-search">Tìm bài viết</label>
            <input id="blog-search" type="search" value={searchText} onChange={(event) => { setSearchText(event.target.value); setVisibleCount(7); }} placeholder="Tìm theo tiêu đề, nội dung hoặc từ khóa…" />
            {searchText && <button type="button" aria-label="Xóa từ khóa tìm kiếm" onClick={() => { setSearchText(""); setVisibleCount(7); }}><i className="bi bi-x-lg" aria-hidden="true"/></button>}
          </div>
        </div>
      </section>

      <div className="public-page-container blog-content">
        <div className="blog-category-bar" role="group" aria-label="Lọc bài viết theo danh mục">
          <button type="button" className={selectedCategory === "all" ? "is-active" : ""} aria-pressed={selectedCategory === "all"} onClick={() => changeCategory("all")}>Tất cả</button>
          {blogCategories.map((category) => (
            <button type="button" key={category.slug} className={selectedCategory === category.slug ? "is-active" : ""} aria-pressed={selectedCategory === category.slug} onClick={() => changeCategory(category.slug)}>{category.label}</button>
          ))}
        </div>

        <div className="blog-results-heading">
          <div><span className="public-eyebrow">KIẾN THỨC THỰC TẾ, DỄ ÁP DỤNG</span><h2>{searchText || selectedCategory !== "all" ? "Bài viết phù hợp" : "Chọn đúng nơi ở, bắt đầu an tâm"}</h2></div>
          <label className="blog-sort-control">Sắp xếp
            <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setVisibleCount(7); }}>
              <option value="curated">Theo chủ đề</option>
              <option value="newest" disabled={!blogPosts.some((post) => getValidBlogDate(post.publishedAt))}>Mới đăng</option>
            </select>
          </label>
        </div>

        {featuredPost ? (
          <div className="blog-editorial-layout">
            <section className="blog-main-column" aria-label="Danh sách bài viết">
              <article className="blog-featured-card">
                <Link to={postLink(featuredPost)} className="blog-featured-image" aria-label={`Đọc ${featuredPost.title}`}>
                  <img src={featuredPost.image} alt={featuredPost.imageAlt} width="900" height="540" fetchpriority="high"/>
                  <span className="blog-featured-label"><i className="bi bi-stars" aria-hidden="true"/> Bài viết nổi bật</span>
                </Link>
                <div className="blog-featured-copy">
                  <Link to={`/blog?category=${featuredPost.categorySlug}`} className="blog-card-category-inline">{featuredPost.category}</Link>
                  <h2><Link to={postLink(featuredPost)}>{featuredPost.title}</Link></h2>
                  <p>{featuredPost.excerpt}</p>
                  <div className="blog-card-meta">{publishedDateMeta(featuredPost)}{articleMeta(featuredPost)}<span>Tác giả: RIPT Rental</span></div>
                  <Link to={postLink(featuredPost)} className="blog-read-more">Đọc bài viết <i className="bi bi-arrow-right" aria-hidden="true"/></Link>
                </div>
              </article>

              <div className="blog-list-heading"><h2>{visiblePosts.length > 1 ? "Khám phá thêm" : "Bài viết nổi bật"}</h2><span>{visiblePosts.length} bài viết</span></div>
              {listedPosts.length > 0 && <div className="blog-card-grid">
                {listedPosts.map((post) => (
                  <article className="blog-card" key={post.slug}>
                    <Link to={postLink(post)} className="blog-card-image-link" aria-label={`Đọc ${post.title}`}>
                      <img src={post.image} alt={post.imageAlt} loading="lazy" width="900" height="540"/>
                    </Link>
                    <div className="blog-card-body">
                      <Link to={`/blog?category=${post.categorySlug}`} className="blog-card-category-inline">{post.category}</Link>
                      <h3><Link to={postLink(post)}>{post.title}</Link></h3>
                      <p>{post.excerpt}</p>
                      <div className="blog-card-meta">{publishedDateMeta(post)}{articleMeta(post)}<span>RIPT Rental</span></div>
                      <Link to={postLink(post)} className="blog-read-more">Đọc bài viết <i className="bi bi-arrow-right" aria-hidden="true"/></Link>
                    </div>
                  </article>
                ))}
              </div>}
              {visiblePosts.length === 1 && <p className="blog-filter-note">Đây là bài viết phù hợp duy nhất với bộ lọc hiện tại.</p>}
              {visiblePosts.length > visibleCount && <div className="blog-load-more-wrap"><button type="button" className="btn btn-outline-primary" onClick={() => setVisibleCount((count) => count + 6)}>Xem thêm bài viết</button></div>}
            </section>

            <aside className="blog-sidebar" aria-label="Thông tin cẩm nang">
              <section className="blog-sidebar-card">
                <p className="blog-sidebar-eyebrow">BẮT ĐẦU TỪ ĐÂY</p><h2>Chủ đề cẩm nang</h2>
                <ul className="blog-sidebar-categories">
                  {blogCategories.map((category) => <li key={category.slug}><button type="button" onClick={() => changeCategory(category.slug)}><span>{category.label}</span><span>{blogPosts.filter((post) => post.categorySlug === category.slug).length}</span></button></li>)}
                </ul>
              </section>
              <section className="blog-sidebar-card">
                <p className="blog-sidebar-eyebrow">ĐỌC TIẾP</p><h2>Gợi ý đọc tiếp</h2>
                <div className="blog-sidebar-recent">{blogPosts.filter((post) => post.slug !== featuredPost.slug).slice(0, 4).map((post) => <Link to={postLink(post)} key={post.slug}><span>{post.category}</span><strong>{post.title}</strong><small>{getBlogReadingMinutes(post)} phút đọc</small></Link>)}</div>
              </section>
              <section className="blog-sidebar-brand"><BrandLogo variant="light" className="blog-sidebar-brand__logo"/><h2>Ở trọ chủ động hơn</h2><p>RIPT Rental biên soạn cẩm nang để bạn có thêm câu hỏi đúng trước khi tìm và thuê phòng.</p><Link to="/search" className="btn btn-primary">Tìm phòng trọ <i className="bi bi-arrow-right" aria-hidden="true"/></Link></section>
            </aside>
          </div>
        ) : (
          <section className="blog-empty-state" role="status">
            <span><i className="bi bi-journal-x" aria-hidden="true"/></span><h2>Chưa tìm thấy bài viết phù hợp</h2><p>Thử từ khóa khác hoặc xem toàn bộ cẩm nang thuê trọ.</p>
            <button type="button" className="btn btn-outline-primary" onClick={() => { setSearchText(""); changeCategory("all"); }}>Hiển thị tất cả bài viết</button>
          </section>
        )}
      </div>
    </main>
  );
};
