import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * One Payload instance per server process. getPayload() initialises the DB
 * pool, so calling it per request would leak connections.
 */
let payloadPromise

export function getPayloadClient() {
  if (!payloadPromise) {
    payloadPromise = getPayload({ config })
  }
  return payloadPromise
}
