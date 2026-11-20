// Extracts and sanitises an <svg> document produced by Claude so it is safe and
// renderable by react-native-svg's SvgXml on iOS, Android and web.

const BLOCKED_ELEMENTS = [
  'script',
  'style',
  'foreignObject',
  'image',
  'text',
  'textPath',
  'tspan',
  'filter',
  'mask',
  'pattern',
  'use',
  'symbol',
  'animate',
  'animateMotion',
  'animateTransform',
  'set',
  'iframe',
  'a',
];

const BLOCKED_ATTRIBUTES = /\s(?:on[a-z]+|filter|mask|class|href|xlink:href)\s*=\s*(?:"[^"]*"|'[^']*')/gi;

export function sanitizeSvg(raw: string): string | null {
  const match = raw.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) return null;
  let svg = match[0];

  for (const tag of BLOCKED_ELEMENTS) {
    // Paired elements (with content) and self-closing ones.
    svg = svg.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), '');
    svg = svg.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi'), '');
  }
  svg = svg.replace(BLOCKED_ATTRIBUTES, '');
  // Drop XML comments, processing instructions and doctype noise.
  svg = svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '');

  // Let the container control the size: remove width/height from the root only.
  svg = svg.replace(/<svg\b([^>]*)>/i, (_whole, attrs: string) => {
    let cleaned = attrs.replace(/\s(?:width|height)\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
    if (!/xmlns=/.test(cleaned)) cleaned = ` xmlns="http://www.w3.org/2000/svg"${cleaned}`;
    return `<svg${cleaned}>`;
  });

  if (!/viewBox=/i.test(svg)) return null;
  // Must still contain at least one drawable shape.
  if (!/<(rect|circle|ellipse|path|polygon|polyline|line)\b/i.test(svg)) return null;
  return svg;
}
