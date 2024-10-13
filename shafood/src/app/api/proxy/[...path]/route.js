import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import axios from 'axios';

const providerUrls = {
  Zepto: 'https://www.zeptonow.com/',
  Zomato: 'https://www.zomato.com/',
  Swiggy: 'https://www.swiggy.com/',
};

let browser;
const apiCache = new Map();

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({ headless: 'new' });
  }
  return browser;
}

async function isApiRoute(provider, path) {
  const cacheKey = `${provider}:${path}`;
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  try {
    const response = await axios.get(`${providerUrls[provider]}${path}`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 5000,
      validateStatus: function (status) {
        return status >= 200 && status < 300; // default
      },
    });
    const isApi = response.headers['content-type'].includes('application/json');
    apiCache.set(cacheKey, isApi);
    return isApi;
  } catch (error) {
    console.error('Error checking API route:', error.message);
    return false;
  }
}

async function proxyRequest(request, provider, path, retryCount = 0) {
  let url;
  if (path.startsWith('http')) {
    url = decodeURIComponent(path);
  } else {
    url = `${providerUrls[provider]}${path}`;
  }

  try {
    const isApi = await isApiRoute(provider, path);

    if (isApi) {
      const response = await axios({
        method: request.method,
        url,
        headers: {
          'User-Agent': request.headers.get('user-agent'),
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': providerUrls[provider],
        },
        data: request.method === 'POST' ? await request.text() : undefined,
        timeout: 10000,
      });
      return new NextResponse(JSON.stringify(response.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    await page.setRequestInterception(true);
    page.on('request', async (req) => {
      if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
        req.continue();
      } else if (req.url().startsWith(providerUrls[provider]) || req.url() === url) {
        const isApiReq = await isApiRoute(provider, new URL(req.url()).pathname);
        if (isApiReq) {
          req.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ proxyHandled: true }),
          });
        } else {
          req.continue();
        }
      } else {
        req.abort();
      }
    });

    const response = await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    const contentType = response.headers()['content-type'];

    if (contentType.includes('image')) {
      const imageBuffer = await response.buffer();
      await page.close();
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: { 'Content-Type': contentType },
      });
    }

    if (contentType.includes('text/html')) {
      await page.evaluate((provider) => {
        document.querySelectorAll('a, link, script, img, form').forEach(el => {
          const attr = el.tagName === 'LINK' || el.tagName === 'A' ? 'href' : 'src';
          if (el[attr] && el[attr].startsWith('/')) {
            el[attr] = `/api/proxy/${provider}${el[attr]}`;
          } else if (el[attr] && el[attr].startsWith('http')) {
            el[attr] = `/api/proxy/${provider}/${encodeURIComponent(el[attr])}`;
          }
          if (el.tagName === 'FORM' && el.action) {
            el.action = `/api/proxy/${provider}/${encodeURIComponent(el.action)}`;
          }
          
          // Prevent links from opening in new tabs/windows
          if (el.tagName === 'A') {
            el.target = '_self';
            el.rel = 'noopener noreferrer';
          }
        });

        // Add custom script to handle link clicks
        const script = document.createElement('script');
        script.textContent = `
          document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link) {
              e.preventDefault();
              window.location.href = link.href;
            }
          });

          // Handle form submissions
          document.addEventListener('submit', function(e) {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            fetch(form.action, {
              method: form.method,
              body: formData
            }).then(response => response.text())
              .then(html => {
                document.open();
                document.write(html);
                document.close();
              });
          });
        `;
        document.head.appendChild(script);
      }, provider);

      const content = await page.content();
      await page.close();
      return new NextResponse(content, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const content = await response.text();
    await page.close();
    return new NextResponse(content, {
      status: 200,
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    console.error('Proxy error:', error.message);
    if (retryCount < 3) {
      console.log(`Retrying... (${retryCount + 1})`);
      return proxyRequest(request, provider, path, retryCount + 1);
    }
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  return proxyRequest(request, params.path[0], params.path.slice(1).join('/'));
}

export async function POST(request, { params }) {
  return proxyRequest(request, params.path[0], params.path.slice(1).join('/'));
}

if (typeof window === 'undefined') {
  process.on('SIGINT', async () => {
    if (browser) {
      await browser.close();
    }
    process.exit();
  });
}