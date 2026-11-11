import config from '@payload-config'
import { NotFoundPage } from '@payloadcms/next/views'

import { importMap } from '../importMap.js'

const NotFound = ({ params, searchParams }) =>
  NotFoundPage({ config, importMap, params, searchParams })

export default NotFound
