import { NextRequest, NextResponse } from 'next/server';

function decodeIfBase64(content: string): string {
  if (!content) return '';
  if (content.startsWith('data:') && content.includes('base64,')) {
    try {
      const base64Part = content.split('base64,')[1].trim();
      return Buffer.from(base64Part, 'base64').toString('utf-8');
    } catch {
      return content;
    }
  }
  return content;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
    }

    const cleanUrl = url.trim().split('#')[0].trim();
    // Fallback CDN domain used by TCS iON Digialm
    const cdnUrl = cleanUrl.replace('://ssc.digialm.com', '://cdn.digialm.com');
    const urlVariants = Array.from(new Set([cleanUrl, cdnUrl]));

    const browserHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
      Referer: 'https://ssc.digialm.com/',
      'Cache-Control': 'no-cache',
    };

    // 1. Direct Server Fetch (Works natively on DigitalOcean BLR1 & Localhost Node.js)
    for (const target of urlVariants) {
      try {
        const directRes = await fetch(target, {
          headers: browserHeaders,
          cache: 'no-store',
        });
        if (directRes.ok) {
          const html = await directRes.text();
          if (html && html.includes('question-pnl')) {
            return NextResponse.json({ html, source: 'direct-server' });
          }
        }
      } catch {
        // Continue to next method
      }
    }

    // 2. Server-Side Multi-Relay Fetch (with Base64 decoding)
    for (const target of urlVariants) {
      const encoded = encodeURIComponent(target);

      const relays = [
        async () => {
          const r = await fetch(`https://api.cors.lol/?url=${encoded}`, { cache: 'no-store' });
          return r.ok ? await r.text() : '';
        },
        async () => {
          const r = await fetch(`https://r.jina.ai/${target}`, {
            headers: { 'X-Return-Format': 'html' },
            cache: 'no-store',
          });
          return r.ok ? await r.text() : '';
        },
        async () => {
          const r = await fetch(`https://api.allorigins.win/get?url=${encoded}`, { cache: 'no-store' });
          if (!r.ok) return '';
          const data = await r.json();
          return decodeIfBase64(data?.contents || '');
        },
        async () => {
          const r = await fetch(`https://api.allorigins.win/raw?url=${encoded}`, { cache: 'no-store' });
          return r.ok ? await r.text() : '';
        },
        async () => {
          const r = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encoded}`, { cache: 'no-store' });
          return r.ok ? await r.text() : '';
        },
      ];

      for (const tryRelay of relays) {
        try {
          const html = await tryRelay();
          if (html && html.includes('question-pnl')) {
            return NextResponse.json({ html, source: 'server-relay' });
          }
        } catch {
          // Try next relay
        }
      }
    }

    return NextResponse.json(
      { error: 'Digialm server denied proxy access or URL has expired (403/404).' },
      { status: 502 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}