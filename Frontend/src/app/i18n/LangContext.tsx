import { createContext, useContext, useState, ReactNode } from 'react';
import { Lang, t as translate } from './index';

interface LangCtxValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LangCtx = createContext<LangCtxValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  return (
    <LangCtx.Provider value={{ lang, setLang, t: (key) => translate(lang, key) }}>
      {children}
    </LangCtx.Provider>
  );
}

export function useLang() {
  return useContext(LangCtx);
}

export function LangSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`flex items-center h-8 bg-card rounded-lg border border-border p-0.5 ${className}`}>
      <button
        onClick={() => setLang('en')}
        className={`px-3 h-full text-[12px] font-semibold rounded-md transition-all ${
          lang === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-text-secondary hover:text-foreground'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('ja')}
        className={`px-3 h-full text-[12px] font-semibold rounded-md transition-all ${
          lang === 'ja'
            ? 'bg-primary text-primary-foreground'
            : 'text-text-secondary hover:text-foreground'
        }`}
      >
        日本語
      </button>
    </div>
  );
}
