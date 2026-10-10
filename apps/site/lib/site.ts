// moodi.dev is not registered yet: fall back to the Vercel production URL
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');
export const GITHUB_URL = 'https://github.com/korneXD/moodi';
export const AUTHOR = { handle: 'itsk0rn3l', url: 'https://x.com/itsk0rn3l', avatar: '/itsk0rn3l.jpg' };
