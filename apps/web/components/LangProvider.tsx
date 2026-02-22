'use client'

import { createContext, useContext, useState, useEffect } from 'react'

export type Lang = 'tr' | 'en'

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (tr: string, en: string) => string
}

const Ctx = createContext<LangCtx>({
  lang: 'tr',
  setLang: () => {},
  t: (tr) => tr,
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('tr')

  useEffect(() => {
    const saved = localStorage.getItem('gbt-lang') as Lang | null
    if (saved === 'tr' || saved === 'en') {
      setLangState(saved)
    } else if (navigator.language.toLowerCase().startsWith('en')) {
      setLangState('en')
    }
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('gbt-lang', l)
  }

  return (
    <Ctx.Provider value={{ lang, setLang, t: (tr, en) => lang === 'en' ? en : tr }}>
      {children}
    </Ctx.Provider>
  )
}

export const useLang = () => useContext(Ctx)
