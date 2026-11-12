import PostCard from './PostCard'

/**
 * Shared archive view for /blog and /blog/category/<slug>.
 * Server component: search, category filters and pagination are plain links
 * and a GET form, so the article list is crawlable without JavaScript.
 */
export default function BlogArchive({
  posts,
  categories = [],
  activeCategory = null,
  query = '',
  page = 1,
  totalPages = 1,
  basePath = '/blog',
  emptyTitle,
  emptyText,
}) {
  const pageHref = (target) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (target > 1) params.set('page', String(target))
    const suffix = params.toString()
    return suffix ? `${basePath}?${suffix}` : basePath
  }

  return (
    <>
      <section className="blog-section" aria-label="Articles">
        <div className="blog-container">
          <div className="blog-toolbar">
            <form className="blog-search" action={basePath} method="get" role="search">
              <label className="visually-hidden" htmlFor="blog-search-input">
                Search articles
              </label>
              <i className="fas fa-magnifying-glass" aria-hidden="true" />
              <input
                id="blog-search-input"
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search articles…"
                autoComplete="off"
              />
              <button type="submit" className="btn btn-pill-red">
                Search
              </button>
            </form>

            {categories.length > 0 && (
              <nav className="blog-filters" aria-label="Filter articles by category">
                <a href="/blog" className={`blog-filter${!activeCategory ? ' active' : ''}`}>
                  All
                </a>
                {categories.map((category) => (
                  <a
                    key={category.id}
                    href={`/blog/category/${category.slug}`}
                    className={`blog-filter${
                      activeCategory?.slug === category.slug ? ' active' : ''
                    }`}
                  >
                    {category.title}
                  </a>
                ))}
              </nav>
            )}
          </div>

          {query && (
            <p className="blog-search-summary" role="status">
              {posts.length > 0
                ? `${posts.length} result${posts.length === 1 ? '' : 's'} for “${query}”`
                : `No results for “${query}”`}
              {' · '}
              <a href={basePath}>Clear search</a>
            </p>
          )}

          {posts.length > 0 ? (
            <div className="blog-grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="blog-empty">
              <div className="blog-empty-icon" aria-hidden="true">
                <i className={query ? 'fas fa-magnifying-glass' : 'fas fa-pen-nib'} />
              </div>
              <h2>
                {emptyTitle ||
                  (query
                    ? 'No articles matched that search'
                    : activeCategory
                      ? 'Nothing here yet'
                      : 'The first article is on its way')}
              </h2>
              <p>
                {emptyText ||
                  (query
                    ? 'Try a shorter phrase, or browse every article.'
                    : activeCategory
                      ? `No articles in “${activeCategory.title}” yet. Check back soon.`
                      : 'We are writing up the studio playbook — branding, social media and websites that actually move the needle. Check back shortly.')}
              </p>
              <a href={query ? basePath : '/our-work'} className="btn btn-pill-red">
                {query ? 'All articles' : 'See our work'} <i className="fas fa-arrow-right" />
              </a>
            </div>
          )}

          {totalPages > 1 && (
            <nav className="blog-pagination" aria-label="Pagination">
              {page > 1 && (
                <a href={pageHref(page - 1)} className="blog-page-link">
                  <i className="fas fa-chevron-left" /> Previous
                </a>
              )}
              <span className="blog-page-status">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <a href={pageHref(page + 1)} className="blog-page-link">
                  Next <i className="fas fa-chevron-right" />
                </a>
              )}
            </nav>
          )}
        </div>
      </section>
    </>
  )
}
