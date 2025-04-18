self.__BUILD_MANIFEST = {
  "polyfillFiles": [
    "static/chunks/polyfills.js"
  ],
  "devFiles": [
    "static/chunks/react-refresh.js"
  ],
  "ampDevFiles": [],
  "lowPriorityFiles": [],
  "rootMainFiles": [],
  "pages": {
    "/_app": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/_app.js"
    ],
    "/_error": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/_error.js"
    ],
    "/caption": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/caption.js"
    ],
    "/dashboard": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/dashboard.js"
    ],
    "/my-templates": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/my-templates.js"
    ],
    "/properties": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/properties.js"
    ],
    "/templates": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/templates.js"
    ]
  },
  "ampFirstPages": []
};
self.__BUILD_MANIFEST.lowPriorityFiles = [
"/static/" + process.env.__NEXT_BUILD_ID + "/_buildManifest.js",
,"/static/" + process.env.__NEXT_BUILD_ID + "/_ssgManifest.js",

];