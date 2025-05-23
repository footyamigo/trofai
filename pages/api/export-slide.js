import chromium from 'chrome-aws-lambda';
import core from 'puppeteer-core'; // Use puppeteer-core

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let browser = null;

  try {
    // For local development, you might need to point to a local Chrome installation.
    // For Vercel, chromium.executablePath will be used.
    const executablePath = process.env.NODE_ENV === 'development' 
      ? (process.platform === 'win32' 
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
          : '/usr/bin/google-chrome' // Adjust for your OS if testing locally
        )
      : await chromium.executablePath;

    if (process.env.NODE_ENV !== 'development' && !executablePath) {
      // Fallback for Vercel if chromium.executablePath is null for some reason
      // This might happen if fonts are not correctly bundled, see Vercel docs on Puppeteer.
      // You might need to ensure fonts are installed via build step or use a layer.
      // For now, we assume chromium.executablePath works.
      throw new Error('Chromium executable path not found for Vercel');
    }

    browser = await core.launch({
      args: process.env.NODE_ENV === 'development' ? [] : chromium.args,
      executablePath: executablePath || undefined, // Use undefined if local path isn't found to let puppeteer-core try to find it
      headless: process.env.NODE_ENV === 'development' ? true : chromium.headless, // Use true for local, chromium.headless for Vercel
      ignoreHTTPSErrors: true,
      defaultViewport: chromium.defaultViewport, // Recommended for serverless
    });

    const page = await browser.newPage();

    // Construct the URL for Puppeteer to visit
    const params = req.method === 'POST' ? req.body : req.query;
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = process.env.VERCEL_URL || 'localhost:3000'; // VERCEL_URL is automatically set by Vercel
    const baseUrl = `${protocol}://${host}`;
    
    const pageUrl = new URL('/export-slide', baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) pageUrl.searchParams.set(key, String(value));
    });

    console.log(`Puppeteer navigating to: ${pageUrl.toString()}`);

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error.message));

    await page.goto(pageUrl.toString(), { waitUntil: 'networkidle0' });

    await page.evaluate(async () => { 
      if (document.fonts) { 
        await document.fonts.ready; 
        document.body.offsetHeight; // Force reflow
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      }
    });

    // Option 1: Screenshot the full viewport (ensure /export-slide page is styled to fit)
    const buffer = await page.screenshot({ type: 'png', fullPage: false });

    // Option 2: Screenshot a specific element (if your ExportSlide component has a root selector like '.export-slide-root')
    // const slideElement = await page.$('.export-slide-root');
    // if (!slideElement) throw new Error('Slide element .export-slide-root not found on page.');
    // const buffer = await slideElement.screenshot({ type: 'png' });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="slide.png"');
    res.status(200).end(buffer, 'binary');

  } catch (err) {
    console.error('Export slide error:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Failed to export slide', details: err.message });
  } finally {
    if (browser !== null && browser.isConnected()) { // Check if browser is connected before closing
      await browser.close();
    }
  }
} 