const fetch = require('node-fetch');

const payload = {
  timeline: {
    cache: false,
    fonts: [
      { src: "https://fonts.gstatic.com/s/anekkannada/v14/raxcHiCNvNMKe1CKFsINYFlgkEIwGa8nL6ruWJg1j--h8pvBKSiw4dFDETujXxM.ttf" },
      { src: "https://fonts.gstatic.com/s/robotoserif/v15/R71RjywflP6FLr3gZx7K8UyuXDs9zVwDmXCb8lxYgmuii32UGoVldX6UgfjL4-3sMM_kB_qXSEXTJQCFLH5-_bcEliotl6B8BQ.ttf" },
      { src: "https://fonts.gstatic.com/s/notoserifolduyghur/v4/v6-KGZbLJFKIhClqUYqXDiGnrVoFRCW6JdwXLeOa.ttf" },
      { src: "https://fonts.gstatic.com/s/sourceserif4/v13/vEFy2_tTDB4M7-auWDN0ahZJW3IX2ih5nk3AucvUHf6OAVIJmeUDygwjihdqnhtdCw.ttf" },
      { src: "https://fonts.gstatic.com/s/averiaseriflibre/v18/neIWzD2ms4wxr6GvjeD0X88SHPyX2xYOoguK.ttf" },
      { src: "https://fonts.gstatic.com/s/zillaslabhighlight/v19/gNMbW2BrTpK8-inLtBJgMMfbm6uNVDvRxitPaWQ.ttf" },
      { src: "https://fonts.gstatic.com/s/trainone/v14/gyB-hwkiNtc6KnxUVjW3Pazd.ttf" },
      { src: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-7rrda-t8ynk-4r83h-wbczf0/source.otf" },
      { src: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-7t2n8-eh1k6-skd7n-3e7wwx/source.otf" },
      { src: "https://fonts.gstatic.com/s/aguafinascript/v22/If2QXTv_ZzSxGIO30LemWEOmt1b3rcQt.ttf" },
      { src: "https://fonts.gstatic.com/s/albertsans/v1/i7dZIFdwYjGaAMFtZd_QA3xXSKZqhr-TenSHq5PPq4fy.ttf" },
      { src: "https://fonts.gstatic.com/s/bevan/v24/4iCj6KZ0a9NXjG8dWC4.ttf" },
      { src: "https://fonts.gstatic.com/s/mclaren/v17/2EbnL-ZuAXFqZFXIeYEV9w.ttf" },
      { src: "https://fonts.gstatic.com/s/bonanovasc/v1/mem5YaShyGWDiYdPG_c1Af4OUuhs.ttf" },
      { src: "https://fonts.gstatic.com/s/offside/v24/HI_KiYMWKa9QrAykc5boQg.ttf" },
      { src: "https://fonts.gstatic.com/s/orelegaone/v12/3qTpojOggD2XtAdFb-QXZFt93kM.ttf" },
      { src: "https://fonts.gstatic.com/s/notosanssymbols2/v24/I_uyMoGduATTei9eI8daxVHDyfisHr71-pTgeQ.ttf" },
      { src: "https://fonts.gstatic.com/s/thegirlnextdoor/v23/pe0zMJCIMIsBjFxqYBIcZ6_OI5oFHCY4ULF_.ttf" },
      { src: "https://fonts.gstatic.com/s/kanit/v15/nKKZ-Go6G5tXcraVGwU.ttf" }
    ],
    background: "#FFFFFF",
    tracks: [
      {"clips":[{"asset":{"type":"text","text":"{{PROPERTY_PRICE}}","alignment":{"horizontal":"center","vertical":"center"},"font":{"color":"#ffffff","family":"Montserrat SemiBold","size":"140","lineHeight":1},"width":985,"height":260},"start":0,"length":5,"offset":{"x":0,"y":-0.034},"position":"center"}]},
      {"clips":[{"asset":{"type":"text","text":"{{LISTING_TYPE}}","alignment":{"horizontal":"center","vertical":"center"},"font":{"color":"#ffffff","family":"Montserrat ExtraBold","size":"100","lineHeight":1},"width":800,"height":138},"start":0,"length":5,"offset":{"x":0,"y":0.097},"position":"center"}]},
      {"clips":[{"asset":{"type":"text","text":"{{SQ_FT}}","alignment":{"horizontal":"left","vertical":"center"},"font":{"color":"#ffffff","family":"Montserrat ExtraBold","size":"32","lineHeight":1},"width":182,"height":72},"start":0,"length":5,"offset":{"x":0.219,"y":-0.104},"position":"center"},{"asset":{"type":"image","src":"{{SQFT_ICON}}"},"start":0,"length":5,"offset":{"x":0.35,"y":-0.104},"position":"center","scale":0.042}]},
      {"clips":[{"asset":{"type":"text","text":"{{BATHROOMS}}","alignment":{"horizontal":"center","vertical":"center"},"font":{"color":"#ffffff","family":"Montserrat ExtraBold","size":"32","lineHeight":1},"width":65,"height":72},"start":0,"length":5,"offset":{"x":0.03,"y":-0.106},"position":"center"},{"length":5.01,"asset":{"type":"image","src":"{{BATHROOM_ICON}}"},"start":49.91,"offset":{"x":0.01,"y":-0.042},"position":"center","scale":0.083}]},
      {"clips":[{"asset":{"type":"text","text":"{{BEDROOMS}}","alignment":{"horizontal":"center","vertical":"center"},"font":{"color":"#ffffff","family":"Montserrat ExtraBold","size":"32","lineHeight":1},"width":64,"height":72},"start":0,"length":5,"offset":{"x":-0.123,"y":-0.106},"position":"center"},{"asset":{"type":"text","text":"{{TEXT_VAR_464}}","alignment":{"horizontal":"center","vertical":"center"},"font":{"color":"#ffffff","family":"Montserrat SemiBold","size":"44","lineHeight":1},"width":683,"height":72,"stroke":{"width":3},"background":{"color":"#000000","borderRadius":41,"padding":0}},"start":49.83,"length":5.1,"offset":{"x":0.028,"y":0.043},"position":"center"}]},
      {"clips":[{"length":5,"asset":{"type":"image","src":"{{SQFT_ICON}}"},"start":0,"offset":{"x":0.097,"y":-0.106},"position":"center","scale":0.042},{"length":5.15,"asset":{"type":"image","src":"{{DARK_SHADOW}}"},"start":49.8}]},
      {"clips":[{"length":5,"asset":{"type":"image","src":"{{BATHROOM_ICON}}"},"start":0,"offset":{"x":-0.042,"y":-0.102},"position":"center","scale":0.042},{"length":7,"asset":{"type":"image","src":"{{PROPERTY_IMAGE8}}"},"start":48.04,"effect":"slideRight","offset":{"x":0.035,"y":0},"position":"center"}]},
      {"clips":[{"length":5,"asset":{"type":"image","src":"{{BEDROOM_ICON}}"},"start":0,"offset":{"x":-0.202,"y":-0.106},"position":"center","scale":0.042},{"length":7,"asset":{"type":"image","src":"{{PROPERTY_IMAGE7}}"},"start":41.18,"effect":"slideRight","position":"center"}]},
      {"clips":[{"asset":{"type":"text","text":"{{PROPERTY_LOCATION}}","alignment":{"horizontal":"center","vertical":"top"},"font":{"color":"#ffffff","family":"Work Sans Light","size":"44","lineHeight":1.06},"width":886,"height":132,"background":{"borderRadius":38,"padding":0},"stroke":{"width":4}},"start":0,"length":5,"offset":{"x":0,"y":0.035},"position":"center"},{"length":7,"asset":{"type":"image","src":"{{PROPERTY_IMAGE4}}"},"start":34.28,"effect":"slideRightSlow","offset":{"x":0.003,"y":0},"position":"center"}]},
      {"clips":[{"length":5,"asset":{"type":"image","src":"{{DARK_SHADOW}}"},"start":0,"opacity":0.58,"position":"center"},{"length":7,"asset":{"type":"image","src":"{{PROPERTY_IMAGE5}}"},"start":27.4,"effect":"slideRightSlow","offset":{"x":-0.015,"y":0},"position":"center"}]},
      {"clips":[{"length":7,"asset":{"type":"image","src":"{{PROPERTY_IMAGE3}}"},"start":20.54,"effect":"slideRightSlow","offset":{"x":-0.013,"y":0},"position":"center"}]},
      {"clips":[{"length":7,"asset":{"type":"image","src":"{{PROPERTY_IMAGE6}}"},"start":13.64,"effect":"slideRightSlow","offset":{"x":-0.012,"y":0},"position":"center"}]},
      {"clips":[{"length":7,"asset":{"type":"image","src":"{{PROPERTY_IMAGE2}}"},"start":6.74,"effect":"slideRightSlow","offset":{"x":0.019,"y":0},"position":"center"}]},
      {
        "clips": [
          {
            "asset": {
              "type": "image",
              "src": "{{AGENT_PHOTO}}"
            },
            "start": 0,
            "length": 5,
            "position": "center",
            "scale": 0.15
          }
        ]
      }
    ]
  },
  output: {
    format: "mp4",
    size: { width: 1080, height: 1920 },
    quality: "high",
    fps: 25
  },
  merge: [
    { find: "PROPERTY_IMAGE1", replace: "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_01_0001.jpeg" },
    { find: "PROPERTY_IMAGE2", replace: "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_02_0001.jpeg" },
    { find: "PROPERTY_IMAGE3", replace: "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_03_0001.jpeg" },
    { find: "PROPERTY_IMAGE4", replace: "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_04_0001.jpeg" },
    { find: "PROPERTY_IMAGE5", replace: "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_05_0001.jpeg" },
    { find: "PROPERTY_IMAGE6", replace: "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_06_0001.jpeg" },
    { find: "PROPERTY_IMAGE7", replace: "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_07_0001.jpeg" },
    { find: "PROPERTY_IMAGE8", replace: "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_08_0001.jpeg" },
    { find: "AGENT_PHOTO", replace: "https://trofai.s3.us-east-1.amazonaws.com/agent-photos/presidentialideas@gmail.com/b0377d4b-bcbe-4c11-adee-9ddc2990def1.png?v=2" },
    { find: "SQUARE_FT", replace: "2456 SQ FT" },
    { find: "SQFT_ICON", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-70t5z-vp03m-8bqmd-ahq57s/source.png" },
    { find: "BATHROOM_ICON", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6yxew-r43vb-xe47k-bcnedf/source.png" },
    { find: "BEDROOM_ICON", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6x636-qz50c-xh6as-m0r5ns/source.png" },
    { find: "DARK_SHADOW", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6hzym-4eg57-5hcgx-xhsmy7/source.png" },
    { find: "DARK_SHADOW2", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6hzym-4eg57-5hcgx-xhsmy7/source.png" },
    { find: "PROPERTY_PRICE", replace: "£5,500 pcm" },
    { find: "PROPERTY_LOCATION", replace: "Tregunter Road, Chelsea,  London, SW10, United Kingdom" },
    { find: "LISTING_TYPE", replace: "Just Sold" },
    { find: "BEDROOMS", replace: "2" },
    { find: "BATHROOMS", replace: "2" }
  ]
};

const url = 'https://api.shotstack.io/edit/v1/render';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'x-api-key': process.env.SHOTSTACK_API_KEY || 'EH81Re1DW1dVlNzga6E1Edq6qzklCohduSGkdbHY'
};

async function pollStatus(renderId, interval = 5000, maxAttempts = 30) {
  const statusUrl = `https://api.shotstack.io/serve/v1/assets/render/${renderId}`;
  // Wait before first poll to allow asset to become available
  await new Promise(r => setTimeout(r, 8000)); // 8 seconds
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let data;
    try {
      const res = await fetch(statusUrl, { headers });
      data = await res.json();
    } catch (err) {
      console.log(`Polling attempt ${attempt}: Invalid or empty JSON, retrying...`);
      await new Promise(r => setTimeout(r, interval));
      continue;
    }
    console.log(`Polling attempt ${attempt}: Full response =`, JSON.stringify(data, null, 2));
    if (data && Array.isArray(data.data)) {
      for (const asset of data.data) {
        const attrs = asset.attributes;
        if (attrs.status === 'ready' && attrs.url) {
          console.log(`\n✅ Asset is ready! Download URL: ${attrs.url}`);
          return attrs.url;
        }
      }
    }
    console.log(`Polling attempt ${attempt}: No asset ready yet.`);
    await new Promise(r => setTimeout(r, interval));
  }
  console.error('❌ Max polling attempts reached. Asset not ready.');
  return null;
}

async function main() {
  try {
    console.log('Final payload being sent to Shotstack:');
    console.log(JSON.stringify(payload, null, 2));
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    const renderId = data.id || (data.response && data.response.id);
    if (renderId) {
      await pollStatus(renderId);
    } else {
      console.error('No render ID returned.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main(); 