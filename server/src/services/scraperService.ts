import axios from 'axios';
import * as cheerio from 'cheerio';

export async function extractTextFromUrl(url: string): Promise<string> {
  const { data: html } = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    timeout: 15000,
  });

  const $ = cheerio.load(html);

  // Remove scripts, styles, navs, footers, headers
  $('script, style, nav, footer, header, aside, iframe, noscript').remove();

  // Try to extract from article tags first
  let text = '';
  const article = $('article');

  if (article.length > 0) {
    text = article
      .find('p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length > 0)
      .join('\n\n');
  }

  // Fallback to all p tags in body
  if (!text || text.length < 100) {
    text = $('body p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length > 0)
      .join('\n\n');
  }

  return text;
}
