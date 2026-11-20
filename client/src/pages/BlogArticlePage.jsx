import React, { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { BrandLogo } from "../components/common/BrandLogo";
import { blogPosts, getBlogPostBySlug, getBlogReadingMinutes, getValidBlogDate } from "../data/blogPosts";
import { slugifyBlogHeading } from "../utils/blogArticle";
import "../styles/public-pages.css";

const formatPublishedDate = (value) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`));

export const BlogArticlePage = () => {
  const { slug } = useParams();
  const post = getBlogPostBySlug(slug);
  const headings = useMemo(() => {
    if (!post) return [];
    const list = post.sections.map((section, index) => ({ id: `${slugifyBlogHeading(section.heading)}-${index + 1}`, title: section.heading }));
    if (post.checklist?.length) list.push({ id: "checklist-ap-dung", title: "Checklist áp dụng" });
    if (post.showRoomCta) list.push({ id: "tim-phong-tro", title: "Bạn đang tìm phòng trọ phù hợp?" });
    return list;
  }, [post]);

  useEffect(() => {
    if (!post) return undefined;
    const previousTitle = document.title;
    let descriptionTag = document.querySelector('meta[name="description"]');
    const createdDescriptionTag = !descriptionTag;
    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.name = "description";
      document.head.appendChild(descriptionTag);
    }
    const previousDescription = descriptionTag.content;
    document.title = `${post.title} | Cẩm nang thuê trọ | RIPT Rental`;
    descriptionTag.content = post.excerpt;
    return () => {
      document.title = previousTitle;
      if (createdDescriptionTag) descriptionTag.remove();
      else descriptionTag.content = previousDescription;
    };
  }, [post]);

  if (!post) {
    return (
      <main className="public-info-page blog-article-page">
        <div className="public-page-container blog-article-missing" role="status">
          <span><i className="bi bi-file-earmark-x" aria-hidden="true"/></span><h1>Không tìm thấy bài viết</h1>
          <p>Đường dẫn có thể đã thay đổi hoặc bài viết không còn trong cẩm nang.</p><Link to="/blog" className="btn btn-primary">Quay lại Cẩm nang thuê trọ</Link>
        </div>
      </main>
    );
  }

  const relatedPosts = (post.relatedSlugs || []).map((relatedSlug) => blogPosts.find((item) => item.slug === relatedSlug)).filter(Boolean).slice(0, 3);
  const readingMinutes = getBlogReadingMinutes(post);
  const tableOfContents = <ol>{headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`}>{heading.title}</a></li>)}</ol>;

  return (
    <main className="public-info-page blog-article-page">
      <div className="public-page-container blog-article-layout">
        <article className="blog-article">
          <nav className="blog-breadcrumb" aria-label="Đường dẫn"><Link to="/">Trang chủ</Link><span>/</span><Link to="/blog">Cẩm nang thuê trọ</Link><span>/</span><span aria-current="page">{post.category}</span></nav>
          <header className="blog-article-header">
            <span className="blog-article-category">{post.category}</span>
            <h1>{post.title}</h1>
            <p>{post.excerpt}</p>
            <div className="blog-article-byline"><span>Biên soạn: RIPT Rental</span><span aria-hidden="true">·</span><span><i className="bi bi-clock" aria-hidden="true"/> {readingMinutes} phút đọc</span>{getValidBlogDate(post.publishedAt) > 0 && <><span aria-hidden="true">·</span><time dateTime={post.publishedAt}><i className="bi bi-calendar3" aria-hidden="true"/> {formatPublishedDate(post.publishedAt)}</time></>}</div>
          </header>
          <img className="blog-article-cover" src={post.image} alt={post.imageAlt} width="900" height="540" fetchpriority="high"/>
          <details className="blog-toc-mobile">
            <summary>Mục lục bài viết</summary>{tableOfContents}
          </details>
          <div className="blog-article-content">
            <p className="blog-article-intro">{post.introduction}</p>
            {post.sections.map((section, index) => (
              <section key={section.heading}>
                <h2 id={headings[index].id}>{section.heading}</h2>
                {section.paragraphs.map((paragraph, paragraphIndex) => <p key={`${section.heading}-${paragraphIndex}`}>{paragraph}</p>)}
                {section.subsections?.map((subsection) => <div key={subsection.heading}><h3>{subsection.heading}</h3>{subsection.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>)}
                {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
                {section.callout && <aside className="blog-article-callout"><strong>{section.callout.title}</strong><p>{section.callout.text}</p></aside>}
              </section>
            ))}
            {post.checklist?.length > 0 && <aside className="blog-article-checklist"><h2 id={headings[post.sections.length]?.id}>Checklist áp dụng</h2><ul>{post.checklist.map((item) => <li key={item}>{item}</li>)}</ul></aside>}
            <aside className="blog-article-conclusion"><strong>Kết luận</strong><p>{post.conclusion}</p></aside>
            {post.showRoomCta && <aside className="blog-article-cta"><div><span>RIPT RENTAL</span><h2 id={headings[post.sections.length + (post.checklist?.length ? 1 : 0)]?.id}>Bạn đang tìm phòng trọ phù hợp?</h2><p>Khám phá danh sách phòng và tiếp tục so sánh các lựa chọn theo nhu cầu của bạn.</p></div><Link to="/search" className="btn btn-primary">Tìm phòng trọ <i className="bi bi-arrow-right" aria-hidden="true"/></Link></aside>}
          </div>
          {relatedPosts.length > 0 && (
            <section className="blog-related">
              <h2>Bài viết liên quan</h2>
              <div>
                {relatedPosts.map((item) => (
                  <Link to={`/blog/${item.slug}`} key={item.slug}>
                    <img src={item.image} alt="" width="160" height="90" loading="lazy" />
                    <span>{item.category} · {getBlogReadingMinutes(item)} phút đọc</span>
                    <strong>{item.title}</strong>
                    <i className="bi bi-arrow-up-right" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          )}
          <Link to="/blog" className="blog-back-link"><i className="bi bi-arrow-left" aria-hidden="true"/> Về Cẩm nang thuê trọ</Link>
        </article>
        <aside className="blog-article-sidebar"><nav className="blog-toc-desktop" aria-label="Mục lục bài viết"><p>MỤC LỤC</p>{tableOfContents}</nav><section className="blog-sidebar-brand"><BrandLogo variant="light" className="blog-sidebar-brand__logo"/><p>Kiến thức thuê trọ được biên soạn bởi RIPT Rental.</p><Link to="/search" className="btn btn-primary">Tìm phòng trọ</Link></section></aside>
      </div>
    </main>
  );
};
