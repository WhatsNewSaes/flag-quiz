// Slugs for explore/content pages (color, pattern, special)
// Kept separate from ContentPage.tsx so it can be imported synchronously
// without pulling the full ContentPage component into the main bundle.

export const CONTENT_SLUGS = new Set([
  // By color
  'with-red',
  'with-blue',
  'with-green',
  'with-yellow',
  'with-white',
  'with-black',
  'with-orange',
  // By pattern
  'horizontal-stripes',
  'vertical-stripes',
  'with-crosses',
  'diagonal-designs',
  'canton-designs',
  'solid-designs',
  'complex-designs',
  // Color combos
  'red-white-and-blue-flags',
  'green-white-and-red-flags',
  'red-and-white-flags',
  'red-yellow-and-green-flags',
  'blue-and-white-flags',
  'blue-and-yellow-flags',
  'orange-white-and-green-flags',
  'black-red-and-yellow-flags',
  'red-white-and-black-flags',
  'green-and-white-flags',
  'red-and-yellow-flags',
  'red-black-white-and-green-flags',
  'black-and-white-flags',
  'green-and-yellow-flags',
  // Special
  'hardest-flags',
  'easiest-flags',
  'similar-looking-flags',
]);
