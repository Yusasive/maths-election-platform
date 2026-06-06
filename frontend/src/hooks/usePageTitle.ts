import { useEffect } from 'react';

const APP_NAME = 'Election Platform';
const DEFAULT_DESCRIPTION = 'Online voting and election management platform';

function setMeta(selector: string, content: string) {
  const el = document.querySelector<HTMLMetaElement>(selector);
  if (el) el.setAttribute('content', content);
}

export function usePageTitle(title: string, meta?: { description?: string; image?: string }) {
  const description = meta?.description;
  const image = meta?.image;

  useEffect(() => {
    const fullTitle = title ? `${title} — ${APP_NAME}` : APP_NAME;
    document.title = fullTitle;

    const desc = description || DEFAULT_DESCRIPTION;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:description"]', desc);

    if (image) {
      setMeta('meta[property="og:image"]', image);
      setMeta('meta[name="twitter:image"]', image);
    }

    return () => {
      document.title = APP_NAME;
      setMeta('meta[name="description"]', DEFAULT_DESCRIPTION);
      setMeta('meta[property="og:title"]', APP_NAME);
      setMeta('meta[property="og:description"]', DEFAULT_DESCRIPTION);
      setMeta('meta[property="og:image"]', '');
      setMeta('meta[name="twitter:title"]', APP_NAME);
      setMeta('meta[name="twitter:description"]', DEFAULT_DESCRIPTION);
      setMeta('meta[name="twitter:image"]', '');
    };
  }, [title, description, image]);
}
