/**
 * UV Index Card for Home Assistant
 * A custom Lovelace card that shows an animated icon for the current UV index.
 *
 * Installable via HACS (category: plugin).
 * https://github.com/juju35/ha-uv-card
 */

const CARD_VERSION = "1.0.0";

// SVG icons are embedded inline so the card is a single self-contained file.
// Keys "0".."11" map to the UV index; "default" is the unavailable fallback.
const ICONS = {
  "0": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\"><defs><linearGradient id=\"a\" x1=\"150\" x2=\"234\" y1=\"119.2\" y2=\"264.8\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fbbf24\"/><stop offset=\".5\" stop-color=\"#fbbf24\"/><stop offset=\"1\" stop-color=\"#f59e0b\"/></linearGradient><symbol id=\"b\" viewBox=\"0 0 384 384\"><circle cx=\"192\" cy=\"192\" r=\"84\" fill=\"url(#a)\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\"/><path fill=\"none\" stroke=\"#fbbf24\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"24\" d=\"M192 61.7V12m0 360v-49.7m92.2-222.5 35-35M64.8 319.2l35.1-35.1m0-184.4-35-35m254.5 254.5-35.1-35.1M61.7 192H12m360 0h-49.7\"><animateTransform additive=\"sum\" attributeName=\"transform\" dur=\"6s\" repeatCount=\"indefinite\" type=\"rotate\" values=\"0 192 192; 45 192 192\"/></path></symbol></defs><use xlink:href=\"#b\" width=\"384\" height=\"384\" transform=\"translate(64 64)\"/></svg>",
  "1": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\"><defs><linearGradient id=\"a\" x1=\"150\" x2=\"234\" y1=\"119.2\" y2=\"264.8\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fbbf24\"/><stop offset=\".5\" stop-color=\"#fbbf24\"/><stop offset=\"1\" stop-color=\"#f59e0b\"/></linearGradient><clipPath id=\"b\"><path fill=\"none\" d=\"M64 64h384v192H328a72 72 0 00-72 72v120H64Z\"/></clipPath><symbol id=\"c\" viewBox=\"0 0 384 384\"><circle cx=\"192\" cy=\"192\" r=\"84\" fill=\"url(#a)\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\"/><path fill=\"none\" stroke=\"#fbbf24\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"24\" d=\"M192 61.7V12m0 360v-49.7m92.2-222.5 35-35M64.8 319.2l35.1-35.1m0-184.4-35-35m254.5 254.5-35.1-35.1M61.7 192H12m360 0h-49.7\"><animateTransform additive=\"sum\" attributeName=\"transform\" dur=\"6s\" repeatCount=\"indefinite\" type=\"rotate\" values=\"0 192 192; 45 192 192\"/></path></symbol></defs><g clip-path=\"url(#b)\"><use xlink:href=\"#c\" width=\"384\" height=\"384\" transform=\"translate(64 64)\"/><path fill=\"none\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\" d=\"M254 338v-10a74 74 0 0174-74h10\"/></g><rect width=\"144\" height=\"144\" x=\"280\" y=\"280\" fill=\"#91c700\" rx=\"48\"/><path fill=\"#fff\" d=\"M366.4 388h-19v-45h-17.8v-12.6h3q7.8 0 12.4-3.4 4.2-3.1 5.5-10.2l.2-.8h15.6Z\"/></svg>",
  "2": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\"><defs><linearGradient id=\"a\" x1=\"150\" x2=\"234\" y1=\"119.2\" y2=\"264.8\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fbbf24\"/><stop offset=\".5\" stop-color=\"#fbbf24\"/><stop offset=\"1\" stop-color=\"#f59e0b\"/></linearGradient><clipPath id=\"b\"><path fill=\"none\" d=\"M64 64h384v192H328a72 72 0 00-72 72v120H64Z\"/></clipPath><symbol id=\"c\" viewBox=\"0 0 384 384\"><circle cx=\"192\" cy=\"192\" r=\"84\" fill=\"url(#a)\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\"/><path fill=\"none\" stroke=\"#fbbf24\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"24\" d=\"M192 61.7V12m0 360v-49.7m92.2-222.5 35-35M64.8 319.2l35.1-35.1m0-184.4-35-35m254.5 254.5-35.1-35.1M61.7 192H12m360 0h-49.7\"><animateTransform additive=\"sum\" attributeName=\"transform\" dur=\"6s\" repeatCount=\"indefinite\" type=\"rotate\" values=\"0 192 192; 45 192 192\"/></path></symbol></defs><g clip-path=\"url(#b)\"><use xlink:href=\"#c\" width=\"384\" height=\"384\" transform=\"translate(64 64)\"/><path fill=\"none\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\" d=\"M254 338v-10a74 74 0 0174-74h10\"/></g><rect width=\"144\" height=\"144\" x=\"280\" y=\"280\" fill=\"#91c700\" rx=\"48\"/><path fill=\"#fff\" d=\"M379.9 388h-55.7q0-9.4 4-15.7 4-6.1 14.8-13.5l11-7.8a22.4 22.4 0 005.9-5.5 10.2 10.2 0 001.7-5.8 8.7 8.7 0 00-2.6-6.7 9.8 9.8 0 00-7-2.4q-10 0-10 11.8v1.5h-17v-2.2q0-12.1 7.2-19t20-6.8q12.5 0 19.8 6t7.4 16.7a22 22 0 01-3.5 12.2q-3.5 5.5-11.2 10.4l-12.1 7.7c-2.3 1.5-3.6 2.8-3.8 3.9h31Z\"/></svg>",
  "3": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\"><defs><linearGradient id=\"a\" x1=\"150\" x2=\"234\" y1=\"119.2\" y2=\"264.8\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fbbf24\"/><stop offset=\".5\" stop-color=\"#fbbf24\"/><stop offset=\"1\" stop-color=\"#f59e0b\"/></linearGradient><clipPath id=\"b\"><path fill=\"none\" d=\"M64 64h384v192H328a72 72 0 00-72 72v120H64Z\"/></clipPath><symbol id=\"c\" viewBox=\"0 0 384 384\"><circle cx=\"192\" cy=\"192\" r=\"84\" fill=\"url(#a)\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\"/><path fill=\"none\" stroke=\"#fbbf24\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"24\" d=\"M192 61.7V12m0 360v-49.7m92.2-222.5 35-35M64.8 319.2l35.1-35.1m0-184.4-35-35m254.5 254.5-35.1-35.1M61.7 192H12m360 0h-49.7\"><animateTransform additive=\"sum\" attributeName=\"transform\" dur=\"6s\" repeatCount=\"indefinite\" type=\"rotate\" values=\"0 192 192; 45 192 192\"/></path></symbol></defs><g clip-path=\"url(#b)\"><use xlink:href=\"#c\" width=\"384\" height=\"384\" transform=\"translate(64 64)\"/><path fill=\"none\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\" d=\"M254 338v-10a74 74 0 0174-74h10\"/></g><rect width=\"144\" height=\"144\" x=\"280\" y=\"280\" fill=\"#ffb800\" rx=\"48\"/><path fill=\"#fff\" d=\"M365.5 349.2a17.8 17.8 0 0110.8 5.7 16.4 16.4 0 013.8 11.2 20 20 0 01-7.2 15.7q-7.3 6.2-20.3 6.2-13.6 0-21-6.7t-7.8-18.6h16.5q.6 11.7 11.7 11.7a11.6 11.6 0 007.7-2.4 8.1 8.1 0 002.8-6.5 7.5 7.5 0 00-3-6.5 14 14 0 00-8.4-2.2h-4.9v-12h5.2c3 0 5.3-.6 7-2a7 7 0 002.4-5.7 7.2 7.2 0 00-2.4-5.8c-1.7-1.4-4-2-7-2s-5.2.7-6.8 2.1-2.4 3.9-2.7 7.2H326q1-22.6 26-22.6 11.8 0 18.5 5.2a16.1 16.1 0 016.6 13.3 14.9 14.9 0 01-3 9.3 15.2 15.2 0 01-8.6 5.4Z\"/></svg>",
  "4": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\"><defs><linearGradient id=\"a\" x1=\"150\" x2=\"234\" y1=\"119.2\" y2=\"264.8\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fbbf24\"/><stop offset=\".5\" stop-color=\"#fbbf24\"/><stop offset=\"1\" stop-color=\"#f59e0b\"/></linearGradient><clipPath id=\"b\"><path fill=\"none\" d=\"M64 64h384v192H328a72 72 0 00-72 72v120H64Z\"/></clipPath><symbol id=\"c\" viewBox=\"0 0 384 384\"><circle cx=\"192\" cy=\"192\" r=\"84\" fill=\"url(#a)\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\"/><path fill=\"none\" stroke=\"#fbbf24\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"24\" d=\"M192 61.7V12m0 360v-49.7m92.2-222.5 35-35M64.8 319.2l35.1-35.1m0-184.4-35-35m254.5 254.5-35.1-35.1M61.7 192H12m360 0h-49.7\"><animateTransform additive=\"sum\" attributeName=\"transform\" dur=\"6s\" repeatCount=\"indefinite\" type=\"rotate\" values=\"0 192 192; 45 192 192\"/></path></symbol></defs><g clip-path=\"url(#b)\"><use xlink:href=\"#c\" width=\"384\" height=\"384\" transform=\"translate(64 64)\"/><path fill=\"none\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\" d=\"M254 338v-10a74 74 0 0174-74h10\"/></g><rect width=\"144\" height=\"144\" x=\"280\" y=\"280\" fill=\"#ffb800\" rx=\"48\"/><path fill=\"#fff\" d=\"M372.2 316v42.5l10.5-.3v14.3l-10.6-.3V388h-17.6v-15.8l-33.2.3V356l32.5-40.1Zm-36.6 42.5h19v-22.8h-.3Z\"/></svg>",
  "5": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\"><defs><linearGradient id=\"a\" x1=\"150\" x2=\"234\" y1=\"119.2\" y2=\"264.8\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fbbf24\"/><stop offset=\".5\" stop-color=\"#fbbf24\"/><stop offset=\"1\" stop-color=\"#f59e0b\"/></linearGradient><clipPath id=\"b\"><path fill=\"none\" d=\"M64 64h384v192H328a72 72 0 00-72 72v120H64Z\"/></clipPath><symbol id=\"c\" viewBox=\"0 0 384 384\"><circle cx=\"192\" cy=\"192\" r=\"84\" fill=\"url(#a)\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\"/><path fill=\"none\" stroke=\"#fbbf24\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"24\" d=\"M192 61.7V12m0 360v-49.7m92.2-222.5 35-35M64.8 319.2l35.1-35.1m0-184.4-35-35m254.5 254.5-35.1-35.1M61.7 192H12m360 0h-49.7\"><animateTransform additive=\"sum\" attributeName=\"transform\" dur=\"6s\" repeatCount=\"indefinite\" type=\"rotate\" values=\"0 192 192; 45 192 192\"/></path></symbol></defs><g clip-path=\"url(#b)\"><use xlink:href=\"#c\" width=\"384\" height=\"384\" transform=\"translate(64 64)\"/><path fill=\"none\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\" d=\"M254 338v-10a74 74 0 0174-74h10\"/></g><rect width=\"144\" height=\"144\" x=\"280\" y=\"280\" fill=\"#ffb800\" rx=\"48\"/><path fill=\"#fff\" d=\"M351.8 388q-12 0-19.7-5.5t-9-15.7l17.6-1.4a9.9 9.9 0 003.8 6 12 12 0 007.2 2.2 11.6 11.6 0 008.5-3 10.5 10.5 0 003-8 10.4 10.4 0 00-3-7.8 11.6 11.6 0 00-8.5-3 12.6 12.6 0 00-9.7 4.3l-16.6-1.5 6.4-38.6H376v14.7h-30.9l-2.3 12 .3.2q5.6-4 14.2-4 10.7 0 17 6.2t6.6 17.1q0 11.8-7.8 18.8t-21.3 7Z\"/></svg>",
  "6": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\"><defs><linearGradient id=\"a\" x1=\"150\" x2=\"234\" y1=\"119.2\" y2=\"264.8\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fbbf24\"/><stop offset=\".5\" stop-color=\"#fbbf24\"/><stop offset=\"1\" stop-color=\"#f59e0b\"/></linearGradient><clipPath id=\"b\"><path fill=\"none\" d=\"M64 64h384v192H328a72 72 0 00-72 72v120H64Z\"/></clipPath><symbol id=\"c\" viewBox=\"0 0 384 384\"><circle cx=\"192\" cy=\"192\" r=\"84\" fill=\"url(#a)\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\"/><path fill=\"none\" stroke=\"#fbbf24\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"24\" d=\"M192 61.7V12m0 360v-49.7m92.2-222.5 35-35M64.8 319.2l35.1-35.1m0-184.4-35-35m254.5 254.5-35.1-35.1M61.7 192H12m360 0h-49.7\"><animateTransform additive=\"sum\" attributeName=\"transform\" dur=\"6s\" repeatCount=\"indefinite\" type=\"rotate\" values=\"0 192 192; 45 192 192\"/></path></symbol></defs><g clip-path=\"url(#b)\"><use xlink:href=\"#c\" width=\"384\" height=\"384\" transform=\"translate(64 64)\"/><path fill=\"none\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\" d=\"M254 338v-10a74 74 0 0174-74h10\"/></g><rect width=\"144\" height=\"144\" x=\"280\" y=\"280\" fill=\"#ff8d00\" rx=\"48\"/><path fill=\"#fff\" d=\"M356.5 338.8q11 0 17.7 6.5t6.8 17.3q0 11.3-7.7 18.4t-20.2 7q-12.6 0-20.6-7.7-9.5-9-9.5-27.7 0-17.5 7.6-27t22.2-9.6q10.1 0 16.8 4.6a22.3 22.3 0 019 13l-16.6 1q-2.1-5.6-9.3-5.6-6 0-9 4t-3.7 13q5.8-7.2 16.5-7.2Zm-12.7 31.6a11.5 11.5 0 008.8 3.7q5.4 0 8.3-3.2a11.9 11.9 0 002.9-8 10.6 10.6 0 00-3.2-8 11.2 11.2 0 00-8.2-3.1 11 11 0 00-8 3 12 12 0 00-3.4 8.2 12.3 12.3 0 002.8 7.4Z\"/></svg>",
  "7": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\"><defs><linearGradient id=\"a\" x1=\"150\" x2=\"234\" y1=\"119.2\" y2=\"264.8\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fbbf24\"/><stop offset=\".5\" stop-color=\"#fbbf24\"/><stop offset=\"1\" stop-color=\"#f59e0b\"/></linearGradient><clipPath id=\"b\"><path fill=\"none\" d=\"M64 64h384v192H328a72 72 0 00-72 72v120H64Z\"/></clipPath><symbol id=\"c\" viewBox=\"0 0 384 384\"><circle cx=\"192\" cy=\"192\" r=\"84\" fill=\"url(#a)\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\"/><path fill=\"none\" stroke=\"#fbbf24\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"24\" d=\"M192 61.7V12m0 360v-49.7m92.2-222.5 35-35M64.8 319.2l35.1-35.1m0-184.4-35-35m254.5 254.5-35.1-35.1M61.7 192H12m360 0h-49.7\"><animateTransform additive=\"sum\" attributeName=\"transform\" dur=\"6s\" repeatCount=\"indefinite\" type=\"rotate\" values=\"0 192 192; 45 192 192\"/></path></symbol></defs><g clip-path=\"url(#b)\"><use xlink:href=\"#c\" width=\"384\" height=\"384\" transform=\"translate(64 64)\"/><path fill=\"none\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\" d=\"M254 338v-10a74 74 0 0174-74h10\"/></g><rect width=\"144\" height=\"144\" x=\"280\" y=\"280\" fill=\"#ff8d00\" rx=\"48\"/><path fill=\"#fff\" d=\"M355.3 388h-20q0-13.7 6.5-29a88.4 88.4 0 0117.9-26.7h-35.5V316h55.6v14.7q-12.3 13.1-18.2 26.8a81.8 81.8 0 00-6.3 30.5Z\"/></svg>",
  "8": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\"><defs><linearGradient id=\"a\" x1=\"150\" x2=\"234\" y1=\"119.2\" y2=\"264.8\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fbbf24\"/><stop offset=\".5\" stop-color=\"#fbbf24\"/><stop offset=\"1\" stop-color=\"#f59e0b\"/></linearGradient><clipPath id=\"b\"><path fill=\"none\" d=\"M64 64h384v192H328a72 72 0 00-72 72v120H64Z\"/></clipPath><symbol id=\"c\" viewBox=\"0 0 384 384\"><circle cx=\"192\" cy=\"192\" r=\"84\" fill=\"url(#a)\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\"/><path fill=\"none\" stroke=\"#fbbf24\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"24\" d=\"M192 61.7V12m0 360v-49.7m92.2-222.5 35-35M64.8 319.2l35.1-35.1m0-184.4-35-35m254.5 254.5-35.1-35.1M61.7 192H12m360 0h-49.7\"><animateTransform additive=\"sum\" attributeName=\"transform\" dur=\"6s\" repeatCount=\"indefinite\" type=\"rotate\" values=\"0 192 192; 45 192 192\"/></path></symbol></defs><g clip-path=\"url(#b)\"><use xlink:href=\"#c\" width=\"384\" height=\"384\" transform=\"translate(64 64)\"/><path fill=\"none\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\" d=\"M254 338v-10a74 74 0 0174-74h10\"/></g><rect width=\"144\" height=\"144\" x=\"280\" y=\"280\" fill=\"#ff3c00\" rx=\"48\"/><path fill=\"#fff\" d=\"M373.4 382.1q-7.9 5.9-21.4 5.9t-21.4-5.9a19 19 0 01-7.9-16 16.2 16.2 0 013.5-10.7 17.7 17.7 0 019.9-5.9v-.2a14.8 14.8 0 01-7.5-5.6 15.3 15.3 0 01-2.7-9 16 16 0 016.8-13.7q7-5 19.3-5t19.3 5a16 16 0 017 13.7 15.4 15.4 0 01-2.8 9.1 14.3 14.3 0 01-7.4 5.5v.3a18.1 18.1 0 019.8 5.9 16.2 16.2 0 013.5 10.6 19 19 0 01-8 16Zm-21.3-7q5.6 0 9-2.5a8.5 8.5 0 003.2-7.1 8.5 8.5 0 00-3.2-7.1c-2.2-1.7-5.2-2.5-9-2.5s-7 .8-9.2 2.5a8.5 8.5 0 00-3.2 7 8.4 8.4 0 003.3 7.2 15 15 0 009 2.5Zm0-30.3q5 0 7.8-2.3a7.4 7.4 0 002.9-6.1 7 7 0 00-2.8-6 13 13 0 00-8-2q-10.7 0-10.7 8a7.4 7.4 0 002.8 6.2q2.8 2.1 8 2.1Z\"/></svg>",
  "9": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\"><defs><linearGradient id=\"a\" x1=\"150\" x2=\"234\" y1=\"119.2\" y2=\"264.8\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fbbf24\"/><stop offset=\".5\" stop-color=\"#fbbf24\"/><stop offset=\"1\" stop-color=\"#f59e0b\"/></linearGradient><clipPath id=\"b\"><path fill=\"none\" d=\"M64 64h384v192H328a72 72 0 00-72 72v120H64Z\"/></clipPath><symbol id=\"c\" viewBox=\"0 0 384 384\"><circle cx=\"192\" cy=\"192\" r=\"84\" fill=\"url(#a)\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\"/><path fill=\"none\" stroke=\"#fbbf24\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"24\" d=\"M192 61.7V12m0 360v-49.7m92.2-222.5 35-35M64.8 319.2l35.1-35.1m0-184.4-35-35m254.5 254.5-35.1-35.1M61.7 192H12m360 0h-49.7\"><animateTransform additive=\"sum\" attributeName=\"transform\" dur=\"6s\" repeatCount=\"indefinite\" type=\"rotate\" values=\"0 192 192; 45 192 192\"/></path></symbol></defs><g clip-path=\"url(#b)\"><use xlink:href=\"#c\" width=\"384\" height=\"384\" transform=\"translate(64 64)\"/><path fill=\"none\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\" d=\"M254 338v-10a74 74 0 0174-74h10\"/></g><rect width=\"144\" height=\"144\" x=\"280\" y=\"280\" fill=\"#ff3c00\" rx=\"48\"/><path fill=\"#fff\" d=\"M371.4 323.7q9.7 9 9.7 27.6 0 17.5-7.7 27.1t-22.3 9.6q-10.1 0-16.8-4.6a21.9 21.9 0 01-9-12.8l16.6-1.1q2.1 5.5 9.3 5.5 5.9 0 9-4t3.8-13q-6 7.1-16.6 7.1-10.9 0-17.6-6.4t-6.9-17.3q0-11.2 7.8-18.4t20-7q12.7 0 20.7 7.7Zm-20 28.5a11 11 0 008.2-3 12.2 12.2 0 003.3-8.3 11.6 11.6 0 00-2.7-7.3 11.2 11.2 0 00-9-3.7c-3.5 0-6.2 1-8.2 3.1a11.3 11.3 0 00-2.9 8 10.9 10.9 0 003.1 8.2 11.3 11.3 0 008.3 3Z\"/></svg>",
  "10": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\"><defs><linearGradient id=\"a\" x1=\"150\" x2=\"234\" y1=\"119.2\" y2=\"264.8\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fbbf24\"/><stop offset=\".5\" stop-color=\"#fbbf24\"/><stop offset=\"1\" stop-color=\"#f59e0b\"/></linearGradient><clipPath id=\"b\"><path fill=\"none\" d=\"M64 64h384v192H328a72 72 0 00-72 72v120H64Z\"/></clipPath><symbol id=\"c\" viewBox=\"0 0 384 384\"><circle cx=\"192\" cy=\"192\" r=\"84\" fill=\"url(#a)\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\"/><path fill=\"none\" stroke=\"#fbbf24\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"24\" d=\"M192 61.7V12m0 360v-49.7m92.2-222.5 35-35M64.8 319.2l35.1-35.1m0-184.4-35-35m254.5 254.5-35.1-35.1M61.7 192H12m360 0h-49.7\"><animateTransform additive=\"sum\" attributeName=\"transform\" dur=\"6s\" repeatCount=\"indefinite\" type=\"rotate\" values=\"0 192 192; 45 192 192\"/></path></symbol></defs><g clip-path=\"url(#b)\"><use xlink:href=\"#c\" width=\"384\" height=\"384\" transform=\"translate(64 64)\"/><path fill=\"none\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\" d=\"M254 338v-10a74 74 0 0174-74h10\"/></g><rect width=\"144\" height=\"144\" x=\"280\" y=\"280\" fill=\"#ff3c00\" rx=\"48\"/><path fill=\"#fff\" d=\"M334.4 388h-19v-45h-17.7v-12.6h3q7.8 0 12.3-3.4 4.3-3.1 5.6-10.2l.2-.8h15.6Zm63.9-9.8q-8.2 9.8-21.9 9.8t-21.9-9.8q-8.1-9.7-8.1-26.4 0-16.5 8.1-26.1 8-9.7 21.9-9.7 13.7 0 21.9 9.7t8 26.1q0 16.6-8 26.4Zm-21.9-4.2q12.6 0 12.6-22t-12.6-22q-12.7 0-12.7 22t12.7 22Z\"/></svg>",
  "11": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\"><defs><linearGradient id=\"a\" x1=\"150\" x2=\"234\" y1=\"119.2\" y2=\"264.8\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fbbf24\"/><stop offset=\".5\" stop-color=\"#fbbf24\"/><stop offset=\"1\" stop-color=\"#f59e0b\"/></linearGradient><clipPath id=\"b\"><path fill=\"none\" d=\"M64 64h384v192H328a72 72 0 00-72 72v120H64Z\"/></clipPath><symbol id=\"c\" viewBox=\"0 0 384 384\"><circle cx=\"192\" cy=\"192\" r=\"84\" fill=\"url(#a)\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\"/><path fill=\"none\" stroke=\"#fbbf24\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"24\" d=\"M192 61.7V12m0 360v-49.7m92.2-222.5 35-35M64.8 319.2l35.1-35.1m0-184.4-35-35m254.5 254.5-35.1-35.1M61.7 192H12m360 0h-49.7\"><animateTransform additive=\"sum\" attributeName=\"transform\" dur=\"6s\" repeatCount=\"indefinite\" type=\"rotate\" values=\"0 192 192; 45 192 192\"/></path></symbol></defs><g clip-path=\"url(#b)\"><use xlink:href=\"#c\" width=\"384\" height=\"384\" transform=\"translate(64 64)\"/><path fill=\"none\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\" d=\"M254 338v-10a74 74 0 0174-74h10\"/></g><rect width=\"144\" height=\"144\" x=\"280\" y=\"280\" fill=\"#9936d4\" rx=\"48\"/><path fill=\"#fff\" d=\"M345 388h-18.9v-45h-17.8v-12.6h3q7.8 0 12.3-3.4 4.3-3.1 5.6-10.2l.2-.8H345Zm46.7 0h-19v-45H355v-12.6h3q7.8 0 12.3-3.4 4.3-3.1 5.6-10.2l.2-.8h15.6Z\"/></svg>",
  "default": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\">\n    <defs>\n        <linearGradient id=\"a\" x1=\"149.99\" y1=\"119.24\" x2=\"234.01\" y2=\"264.76\" gradientUnits=\"userSpaceOnUse\">\n            <stop offset=\"0\" stop-color=\"#fbbf24\"/>\n            <stop offset=\"0.45\" stop-color=\"#fbbf24\"/>\n            <stop offset=\"1\" stop-color=\"#f59e0b\"/>\n        </linearGradient>\n        <clipPath id=\"b\">\n            <path d=\"M64,64H448V256H328a72,72,0,0,0-72,72V448H64Z\" fill=\"none\"/>\n        </clipPath>\n        <symbol id=\"c\" viewBox=\"0 0 384 384\">\n            <circle cx=\"192\" cy=\"192\" r=\"84\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\" fill=\"url(#a)\"/>\n            <path d=\"M192,61.66V12m0,360V322.34M284.17,99.83l35.11-35.11M64.72,319.28l35.11-35.11m0-184.34L64.72,64.72M319.28,319.28l-35.11-35.11M61.66,192H12m360,0H322.34\" fill=\"none\" stroke=\"#fbbf24\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"24\"/>\n        </symbol>\n    </defs>\n    <g clip-path=\"url(#b)\">\n        <use width=\"384\" height=\"384\" transform=\"translate(64 64)\" xlink:href=\"#c\"/>\n        <path d=\"M254,338V328a74,74,0,0,1,74-74h10\" fill=\"none\" stroke=\"#f8af18\" stroke-miterlimit=\"10\" stroke-width=\"6\"/>\n    </g>\n    <path d=\"M337.71,388q-14.4,0-22.14-6.76t-7.74-19.39V316h18.32v45.94q0,11.07,11.65,11.07t11.56-11.07V316h18.32v45.85q0,12.73-7.74,19.44T337.71,388Z\" fill=\"#374251\"/>\n    <path d=\"M413.43,344.51,421.56,316h18.61l-22.53,69.75H398.25L375.71,316h18.81l8.23,28.41,5.39,21.94Z\" fill=\"#374251\"/>\n</svg>"
};

// UV risk levels per WHO classification.
// Each band defines a translation key, an accent color and the SVG used for it.
const UV_LEVELS = [
  { max: 2, key: "low", color: "#558b2f" },
  { max: 5, key: "moderate", color: "#f9a825" },
  { max: 7, key: "high", color: "#ef6c00" },
  { max: 10, key: "very_high", color: "#b71c1c" },
  { max: Infinity, key: "extreme", color: "#6a1b9a" },
];

function levelFor(value) {
  return UV_LEVELS.find((l) => value <= l.max);
}

// Translations. "name" is the default card title; the other keys are the risk
// labels and the unavailable state. English ("en") is the fallback.
const TRANSLATIONS = {
  en: { name: "UV Index", low: "Low", moderate: "Moderate", high: "High", very_high: "Very High", extreme: "Extreme", unavailable: "Unavailable" },
  fr: { name: "Indice UV", low: "Faible", moderate: "Modéré", high: "Élevé", very_high: "Très élevé", extreme: "Extrême", unavailable: "Indisponible" },
  de: { name: "UV-Index", low: "Niedrig", moderate: "Mäßig", high: "Hoch", very_high: "Sehr hoch", extreme: "Extrem", unavailable: "Nicht verfügbar" },
  es: { name: "Índice UV", low: "Bajo", moderate: "Moderado", high: "Alto", very_high: "Muy alto", extreme: "Extremo", unavailable: "No disponible" },
  it: { name: "Indice UV", low: "Basso", moderate: "Moderato", high: "Alto", very_high: "Molto alto", extreme: "Estremo", unavailable: "Non disponibile" },
  nl: { name: "UV-index", low: "Laag", moderate: "Matig", high: "Hoog", very_high: "Zeer hoog", extreme: "Extreem", unavailable: "Niet beschikbaar" },
  pt: { name: "Índice UV", low: "Baixo", moderate: "Moderado", high: "Alto", very_high: "Muito alto", extreme: "Extremo", unavailable: "Indisponível" },
};

// Resolve a translation for the given language, falling back to the base
// language code (e.g. "fr-CA" -> "fr") and finally to English.
function localize(key, lang) {
  const code = (lang || "en").toLowerCase();
  const dict =
    TRANSLATIONS[code] || TRANSLATIONS[code.split("-")[0]] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key];
}

function iconSvg(index) {
  return ICONS[String(index)] || ICONS.default;
}

class UvIndexCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define an 'entity'");
    }
    this._config = {
      ...config,
      name: config.name,
      show_label: config.show_label !== false,
      show_value: config.show_value !== false,
      // "horizontal" = text to the right (default), "vertical" = text below.
      layout: config.layout === "vertical" ? "vertical" : "horizontal",
      // Drop the card background, border and shadow for a transparent look.
      transparent: config.transparent === true,
      // "center" (default) or "top": vertical alignment inside the card,
      // useful to line the card up with others in a horizontal-stack.
      align: config.align === "top" ? "top" : "center",
    };
    this._configSig = JSON.stringify(this._config);
    this._sig = null; // force a re-render on the next paint
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  // Cheap fingerprint of everything that affects the rendered output, so we
  // only rebuild the DOM (and restart the SVG animation) when it changes.
  _signature(stateObj) {
    return [
      this._configSig,
      stateObj ? stateObj.state : null,
      stateObj ? stateObj.attributes.friendly_name : null,
      this._hass ? this._hass.language : null,
    ].join("|");
  }

  getCardSize() {
    return 3;
  }

  static getStubConfig() {
    return { entity: "sensor.uv_index" };
  }

  _render() {
    if (!this._config) return;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    const entityId = this._config.entity;
    const stateObj = this._hass ? this._hass.states[entityId] : undefined;

    // Skip the rebuild if nothing visible changed (avoids the icon flicker
    // on every Home Assistant state tick).
    const sig = this._signature(stateObj);
    if (sig === this._sig && this.shadowRoot) return;
    this._sig = sig;

    const raw = stateObj ? Number(stateObj.state) : NaN;
    const available = stateObj && Number.isFinite(raw);

    // Round and clamp the UV index to the available icons (0-11).
    let index = available ? Math.max(0, Math.round(raw)) : NaN;
    if (Number.isFinite(index) && index > 11) index = 11;

    // Language: explicit config wins, otherwise follow the Home Assistant UI.
    const lang =
      this._config.language || (this._hass && this._hass.language) || "en";

    const level = available ? levelFor(raw) : null;
    const name =
      this._config.name ||
      (stateObj && stateObj.attributes.friendly_name) ||
      localize("name", lang);

    const valueText = available ? String(Math.round(raw)) : "—";
    const labelText = level
      ? localize(level.key, lang)
      : localize("unavailable", lang);
    const color = level ? level.color : "var(--secondary-text-color)";
    const vertical = this._config.layout === "vertical";
    const transparent = this._config.transparent;
    const top = this._config.align === "top";

    // Cross-axis (horizontal layout) and main-axis (vertical layout) alignment.
    const alignItems = !vertical && top ? "flex-start" : "center";
    const justify = vertical && top ? "flex-start" : "center";

    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          display: flex;
          flex-direction: ${vertical ? "column" : "row"};
          align-items: ${alignItems};
          justify-content: ${justify};
          text-align: ${vertical ? "center" : "left"};
          gap: ${vertical ? "8px" : "16px"};
          padding: 16px;
          box-sizing: border-box;
          ${top ? "height: 100%;" : ""}
          cursor: pointer;
          --uv-color: ${color};
          ${transparent ? "background: none; box-shadow: none; border: none;" : ""}
        }
        .icon {
          width: 72px;
          height: 72px;
          flex: 0 0 auto;
        }
        .icon svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .name {
          font-size: 1rem;
          font-weight: 500;
          color: var(--primary-text-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .value {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.1;
          color: var(--uv-color);
        }
        .label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--uv-color);
        }
      </style>
      <ha-card>
        <div class="icon" title="${labelText}">${iconSvg(index)}</div>
        <div class="info">
          <div class="name">${name}</div>
          ${this._config.show_value ? `<div class="value">${valueText}</div>` : ""}
          ${this._config.show_label ? `<div class="label">${labelText}</div>` : ""}
        </div>
      </ha-card>
    `;

    const card = this.shadowRoot.querySelector("ha-card");
    card.addEventListener("click", () => this._openMoreInfo(entityId));
  }

  _openMoreInfo(entityId) {
    const event = new Event("hass-more-info", { bubbles: true, composed: true });
    event.detail = { entityId };
    this.dispatchEvent(event);
  }
}

customElements.define("ha-uv-card", UvIndexCard);

// Register the card so it shows up in the dashboard card picker.
window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha-uv-card",
  name: "UV Index Card",
  description: "Displays the current UV index with an animated weather-style icon.",
  preview: true,
  documentationURL: "https://github.com/juju35/ha-uv-card",
});

console.info(
  `%c HA-UV-CARD %c v${CARD_VERSION} `,
  "color: white; background: #f9a825; font-weight: 700;",
  "color: #f9a825; background: white; font-weight: 700;"
);
