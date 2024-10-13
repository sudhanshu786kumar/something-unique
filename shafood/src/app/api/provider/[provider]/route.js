import { NextResponse } from 'next/server';
import { parse } from 'node-html-parser';

const providerUrls = {
  Zepto: 'https://www.zeptonow.com/',
  Zomato: 'https://www.zomato.com/',
  Swiggy: 'https://www.swiggy.com/',
};

export async function GET(request, { params }) {
  const { provider } = params;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url') || providerUrls[provider];

  console.log(`Fetching content for: ${targetUrl}`);

  if (!targetUrl) {
    return NextResponse.json({ error: 'Invalid provider or URL' }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    console.log(`Received response with status: ${response.status}`);

    let content = await response.text();
    console.log(`Received content length: ${content.length}`);

    // Parse the HTML content
    const root = parse(content);

    // Rewrite all URLs to go through our proxy
    root.querySelectorAll('a, link, script, img').forEach(el => {
      const attr = el.tagName === 'A' ? 'href' : 'src';
      if (el.getAttribute(attr) && !el.getAttribute(attr).startsWith('data:')) {
        el.setAttribute(attr, `/api/provider/${provider}?url=${encodeURIComponent(new URL(el.getAttribute(attr), targetUrl).href)}`);
      }
    });

    // Rewrite inline styles with url() to go through our proxy
    root.querySelectorAll('*[style]').forEach(el => {
      const style = el.getAttribute('style');
      if (style && style.includes('url(')) {
        const newStyle = style.replace(/url\(['"]?(.+?)['"]?\)/g, (match, url) => {
          if (url.startsWith('data:')) return match;
          return `url("/api/provider/${provider}?url=${encodeURIComponent(new URL(url, targetUrl).href)}")`;
        });
        el.setAttribute('style', newStyle);
      }
    });

    // Add base tag to ensure relative URLs resolve correctly
    const baseTag = `<base href="${targetUrl}">`;
    root.querySelector('head').insertAdjacentHTML('afterbegin', baseTag);

    // Serialize the modified HTML
    content = root.toString();

    // Create a new response with modified headers and content
    const modifiedResponse = new NextResponse(content, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html',
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "frame-ancestors 'self'",
      },
    });

    // Copy all headers from the original response, except those we want to modify
    for (const [key, value] of response.headers.entries()) {
      if (!['x-frame-options', 'content-security-policy', 'content-length'].includes(key.toLowerCase())) {
        modifiedResponse.headers.set(key, value);
      }
    }

    console.log('Sending modified response');
    return modifiedResponse;
  } catch (error) {
    console.error(`Error fetching provider content for ${targetUrl}:`, error);
    return NextResponse.json({ 
      error: 'Failed to fetch content',
      details: error.message
    }, { status: 500 });
  }
}
