/* Payload admin root layout. Required by @payloadcms/next. */
import config from '@payload-config'
import '@payloadcms/next/css'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap.js'

const serverFunction = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

const Layout = ({ children }) =>
  RootLayout({ children, config, importMap, serverFunction })

export default Layout
