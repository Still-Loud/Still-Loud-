import { notFound } from 'next/navigation'

/* Catch-all for unmatched URLs in the frontend group. Rendering the group's
   not-found inside it keeps the brand layout (fonts, navbar, footer) and still
   returns a 404 status. Without this, Next falls back to its unstyled built-in
   page because the project uses multiple root layouts. */
export default function CatchAllPage() {
  notFound()
}
