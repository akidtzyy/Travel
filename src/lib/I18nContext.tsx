import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getLocale, setLocale, onLocaleChange, type Locale, t, translateText } from './i18n';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof t;
  translateText: typeof translateText;
}

const I18nContext = createContext<I18nContextType>({
  locale: getLocale(),
  setLocale: () => {},
  t,
  translateText,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  useEffect(() => {
    const unsubscribe = onLocaleChange(() => {
      setLocaleState(getLocale());
    });
    return () => { unsubscribe(); };
  }, []);

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t, translateText: translateText }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
