import Link from 'next/link'

import { formatDate, mediaUrl } from '../../lib/media'

/* Blog list card. Server component — no client JS. */
export default function PostCard({ post }) {
  const image = mediaUrl(post.heroImage, 'card')
  const date = formatDate(post.publishedAt || post.createdAt)
  const categories = Array.isArray(post.categories) ? post.categories.filter(Boolean) : []

  return (
    <Link href={`/blog/${post.slug}`} className="blog-card">
      <div className="blog-card-media">
        {image ? (
          <img src={image} alt={post.heroImage?.alt || post.title} loading="lazy" decoding="async" />
        ) : (
          <div className="blog-card-placeholder" aria-hidden="true">
            StillLoud
          </div>
        )}
      </div>

      <div className="blog-card-body">
        {categories.length > 0 && (
          <div className="blog-card-cats">
            {categories.slice(0, 2).map((category) => (
              <span key={category.id || category.slug} className="blog-cat-pill">
                {category.title}
              </span>
            ))}
          </div>
        )}

        <h2 className="blog-card-title">{post.title}</h2>
        <p className="blog-card-excerpt">{post.excerpt}</p>

        <div className="blog-card-meta">
          {date && <span>{date}</span>}
          {date && post.readingTime ? <span className="dot" /> : null}
          {post.readingTime ? <span>{post.readingTime} min read</span> : null}
        </div>
      </div>
    </Link>
  )
}
