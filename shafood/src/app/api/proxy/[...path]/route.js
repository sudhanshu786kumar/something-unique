import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request, { params }) {
  const path = params.path;
  const provider = path[0];
  const restOfPath = path.slice(1).join('/');

  const providerUrls = {
    Zepto: 'https://www.zeptonow.com/',
    Zomato: 'https://www.zomato.com/',
    Swiggy: 'https://www.swiggy.com/',
  };

  const url = `${providerUrls[provider]}${restOfPath}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': request.headers.get('user-agent'),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/',
      },
    });
    
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}
