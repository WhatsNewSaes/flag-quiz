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
  // Special
  'hardest-flags',
  'easiest-flags',
  'red-white-and-blue-flags',
  'similar-looking-flags',
]);
