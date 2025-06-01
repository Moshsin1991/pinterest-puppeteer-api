import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const keyword = req.query.q;

  if (!keyword) {
    return res.status(400).json({ error: 'Missing search keyword (use ?q=keyword)' });
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    headless: true,
  });
  const page = await browser.newPage();

  const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(keyword)}`;
  await page.goto(searchUrl, { waitUntil: 'networkidle2' });

  // Scroll to load images
  await page.evaluate(() => window.scrollBy(0, 1000));
  await page.waitForTimeout(2000);

  const pins = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img')).slice(0, 10);
    return images.map(img => ({
      title: img.alt || 'No alt text',
      image_url: img.src,
    }));
  });

  await browser.close();
  res.json({ keyword, results: pins });
});

app.listen(port, () => {
  console.log(`Pinterest scraper running on port ${port}`);
});
