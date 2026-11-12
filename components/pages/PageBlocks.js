import { RichText } from '@payloadcms/richtext-lexical/react'

import { mediaAlt, mediaPosterUrl, mediaUrl } from '../../lib/media'

/**
 * Controlled page sections. Each block maps to one component below and uses the
 * existing StillLoud palette/typography — there is no free-form HTML.
 */

function SectionHeading({ eyebrow, heading }) {
  if (!eyebrow && !heading) return null
  return (
    <header className="pg-heading">
      {eyebrow && (
        <div className="eyebrow">
          <span className="bullet-dot" /> {eyebrow}
        </div>
      )}
      {heading && <h2>{heading}</h2>}
    </header>
  )
}

function TextBlock({ block }) {
  return (
    <section className="pg-section" id={block.anchor || undefined}>
      <div className="pg-container pg-narrow">
        <SectionHeading eyebrow={block.eyebrow} heading={block.heading} />
        {block.content && (
          <div className="pg-rich">
            <RichText data={block.content} />
          </div>
        )}
      </div>
    </section>
  )
}

function ImageTextBlock({ block }) {
  const image = mediaUrl(block.image, 'hero')
  const isLeft = block.imagePosition === 'left'

  return (
    <section className="pg-section" id={block.anchor || undefined}>
      <div className="pg-container">
        <div className={`pg-image-text${isLeft ? ' pg-image-text--left' : ''}`}>
          <div className="pg-image-text-media">
            {image && (
              <img
                src={image}
                alt={block.imageAlt || mediaAlt(block.image, block.heading || 'StillLoud work')}
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
          <div className="pg-image-text-copy">
            <SectionHeading eyebrow={block.eyebrow} heading={block.heading} />
            {block.content && (
              <div className="pg-rich">
                <RichText data={block.content} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function GalleryBlock({ block }) {
  const images = (block.images || []).filter((item) => item?.image)
  if (images.length === 0) return null

  return (
    <section className="pg-section" id={block.anchor || undefined}>
      <div className="pg-container">
        <SectionHeading eyebrow={block.eyebrow} heading={block.heading} />
        <div className={`pg-gallery pg-gallery--${block.columns || '3'}`}>
          {images.map((item, index) => (
            <figure key={item.id || index}>
              <img
                src={mediaUrl(item.image, 'card')}
                alt={mediaAlt(item.image, item.caption || `Gallery image ${index + 1}`)}
                loading="lazy"
                decoding="async"
              />
              {item.caption && <figcaption>{item.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function VideoBlock({ block }) {
  const src = block.videoUrl || mediaUrl(block.video)
  if (!src) return null
  const poster = mediaUrl(block.poster, 'card') || mediaPosterUrl(block.video) || undefined

  return (
    <section className="pg-section" id={block.anchor || undefined}>
      <div className="pg-container pg-narrow">
        <SectionHeading eyebrow={block.eyebrow} heading={block.heading} />
        {block.text && <p className="pg-lead">{block.text}</p>}
        <video
          className="pg-video"
          src={src}
          poster={poster}
          controls
          playsInline
          preload="metadata"
        />
      </div>
    </section>
  )
}

function FaqBlock({ block }) {
  const items = (block.items || []).filter((item) => item?.question && item?.answer)
  if (items.length === 0) return null

  return (
    <section className="pg-section" id={block.anchor || undefined}>
      <div className="pg-container pg-narrow">
        <SectionHeading eyebrow={block.eyebrow} heading={block.heading} />
        {block.text && <p className="pg-lead">{block.text}</p>}
        <div className="pg-faq">
          {items.map((item, index) => (
            <details key={item.id || index} className="pg-faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBlock({ block }) {
  return (
    <section
      className={`pg-cta pg-cta--${block.style || 'red'}`}
      id={block.anchor || undefined}
    >
      <div className="pg-container pg-narrow">
        <h2>{block.heading}</h2>
        {block.text && <p>{block.text}</p>}
        {block.buttonLabel && (
          <a href={block.buttonUrl || '/#contact'} className="btn btn-pill-red">
            {block.buttonLabel} <i className="fas fa-arrow-right" />
          </a>
        )}
      </div>
    </section>
  )
}

const BLOCKS = {
  text: TextBlock,
  imageText: ImageTextBlock,
  gallery: GalleryBlock,
  video: VideoBlock,
  faq: FaqBlock,
  cta: CtaBlock,
}

export default function PageBlocks({ blocks = [] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const Component = BLOCKS[block.blockType]
        if (!Component) return null
        return <Component key={block.id || index} block={block} />
      })}
    </>
  )
}

/** FAQ entries for FAQPage structured data. */
export function faqItemsFromBlocks(blocks = []) {
  return blocks
    .filter((block) => block.blockType === 'faq')
    .flatMap((block) => block.items || [])
    .filter((item) => item?.question && item?.answer)
}
