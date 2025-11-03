
import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // La politique CSP originale extraite des logs d'erreur
  const cspHeader = `
    connect-src 'self' https://v0.dev https://v0.app https://v0chat.vercel.sh https://v0docs.vercel.sh https://v0-marketing.vercel.sh https://vercel.live/ https://vercel.com https://*.pusher.com/ https://blob.vercel-storage.com https://*.blob.vercel-storage.com https://blobs.vusercontent.net wss://*.pusher.com/ https://fides-vercel.us.fides.ethyca.com/api/v1/ https://cdn-api.ethyca.com/location https://privacy-vercel.us.fides.ethyca.com/api/v1/ https://*.sentry.io/api/ https://huggingface.co/onnx-community/ https://cas-bridge.xethub.hf.co/xet-bridge-us/ https://cdn.jsdelivr.net/npm/@huggingface/ *.cr-relay.com https://api.v0.app;
  `
    // J'ai ajouté https://api.v0.app à la fin de la directive connect-src.

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set(
    'Content-Security-Policy',
    // Remplacer les espaces multiples et les sauts de ligne par un seul espace
    cspHeader.replace(/\s{2,}/g, ' ').trim()
  )

  return NextResponse.next({
    headers: requestHeaders,
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
