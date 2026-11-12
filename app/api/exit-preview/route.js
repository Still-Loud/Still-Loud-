import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

/** Leaves draft mode and returns to the public version of the page. */
export async function GET(request) {
  const mode = await draftMode()
  mode.disable()

  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  redirect(path && path.startsWith('/') ? path : '/')
}
