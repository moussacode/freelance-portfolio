import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { FreelanceView } from '@/views/FreelanceView';
import { htmlLang, isLocale, type Locale } from '@/content/i18n';
import { getDict } from '@/content/ui';
import { usePath } from './shims/router';
import '@/app/globals.css';
import './fonts.css';

function App() {
  const loc = usePath().split('/')[1];
  const locale: Locale = isLocale(loc) ? loc : 'fr';
  useEffect(() => {
    document.documentElement.lang = htmlLang[locale];
    document.title = getDict(locale).meta.title;
  }, [locale]);
  return (
    <Shell locale={locale}>
      <FreelanceView key={locale} />
    </Shell>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
