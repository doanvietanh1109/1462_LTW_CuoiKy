import React from "react";
import { Link, useParams } from "react-router-dom";
import { blogPosts } from "../data/blogPosts";
import "../styles/public-pages.css";

const formatPublishedDate = (value) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`));

export const BlogArticlePage = () => {
  const { slug } = useParams();
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    return (
      <main className="public-info-page blog-article-page">
        <div className="public-page-container blog-article-missing" role="status">
          <span><i className="bi bi-file-earmark-x" aria-hidden="true"/></span>
          <h1>Không tìm thấy bài viết</h1>
          <p>Đường dẫn có thể đã thay đổi hoặc bài viết không còn trong cẩm nang.</p>
          <Link to="/blog" className="btn btn-primary">Quay lại Blog</Link>
        </div>
      </main>
    );
  }

  const relatedPosts = blogPosts.filter((item) => item.slug !== post.slug && item.category === post.category).slice(0, 2);

  return (
    <main className="public-info-page blog-article-page">
      <article className="public-page-container blog-article">
        <Link to="/blog" className="blog-back-link"><i className="bi bi-arrow-left" aria-hidden="true"/> Quay lại Cẩm nang thuê trọ</Link>
        <header className="blog-article-header">
          <span className="blog-article-category">{post.category}</span>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          <time dateTime={post.publishedAt}><i className="bi bi-calendar3" aria-hidden="true"/> {formatPublishedDate(post.publishedAt)}</time>
        </header>
        <img className="blog-article-cover" src={post.image} alt={post.imageAlt}/>
        <div className="blog-article-content">
          <p className="blog-article-intro">{post.introduction}</p>
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
            </section>
          ))}
          <aside className="blog-article-conclusion"><strong>Kết luận</strong><p>{post.conclusion}</p></aside>
        </div>
        {relatedPosts.length > 0 && (
          <section className="blog-related">
            <h2>Bài viết cùng chủ đề</h2>
            <div>{relatedPosts.map((item) => <Link to={`/blog/${item.slug}`} key={item.slug}><span>{item.category}</span><strong>{item.title}</strong><i className="bi bi-arrow-up-right" aria-hidden="true"/></Link>)}</div>
          </section>
        )}
      </article>
    </main>
  );
};
