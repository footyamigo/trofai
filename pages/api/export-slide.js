export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    // Dynamically import puppeteer only when this API route is called
    const puppeteer = await import('puppeteer');

    // Accept slide data via query or body
    const params = req.method === 'POST' ? req.body : req.query;
    // Build the export-slide URL with query params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = new URL('/export-slide', baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, value);
    });

    // Launch Puppeteer (local/server: use default puppeteer)
    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
      defaultViewport: { width: 1080, height: 1350 },
    });
    const page = await browser.newPage();
    await page.goto(url.toString(), { waitUntil: 'networkidle0' });
    // Wait for web fonts to load
    await page.evaluate(async () => { if (document.fonts) await document.fonts.ready; });
    // Screenshot the full page (should be 1080x1350)
    const buffer = await page.screenshot({ type: 'png', fullPage: false });
    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="slide.png"');
    res.status(200).end(buffer, 'binary');
  } catch (err) {
    console.error('Export slide error:', err);
    res.status(500).json({ error: 'Failed to export slide', details: err.message });
  }
} 