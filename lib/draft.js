import { draftMode } from 'next/headers'

/**
 * True inside a Payload admin preview session.
 *
 * Draft mode is switched on by /api/preview after it verifies the admin session
 * and is switched off by /api/exit-preview.
 */
export async function isPreview() {
  const mode = await draftMode()
  return mode.isEnabled
}
