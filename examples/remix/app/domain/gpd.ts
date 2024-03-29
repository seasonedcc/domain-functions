import * as z from 'zod'
import { makeDomainFunction as mdf } from 'domain-functions'
import { createCookie } from '@remix-run/node'

const cookie = createCookie('gpd', {
  maxAge: 60, // One minute, but should probably be longer
})

const getGPDInfo = mdf(
  z.any(),
  // The "environment" knows there can be cookie information in the Request
  z.object({ agreed: z.boolean().optional() }),
)(async (_input, { agreed }) => {
  return { agreed }
})

const agreeToGPD = mdf(
  // Agreeing to the GPD is user input
  z.object({ agree: z.preprocess((v) => v === 'true', z.boolean()) }),
)(async ({ agree }) => ({ agreed: agree }))

export { cookie, agreeToGPD, getGPDInfo }
