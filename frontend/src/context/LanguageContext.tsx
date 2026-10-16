import { createContext, useContext, useState, ReactNode } from "react";
import pl from "../locales/pl.json";
import en from "../locales/en.json";

type Language = "pl" | "en";
type TranslationKey = keyof typeof pl;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey | string) => string;
  formatDate: (date: string | Date | null | undefined, includeTime?: boolean) => string;
}

const translations: Record<Language, Record<string, string>> = { pl, en };

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>(() => localStorage.getItem('language') === 'en' ? 'en' : 'pl');
  const setLanguage = (value: Language) => { localStorage.setItem('language', value); updateLanguage(value); };

  const t = (key: TranslationKey | string): string => {
    return translations[language][key] || key;
  };

  const formatDate = (
    date: string | Date | null | undefined,
    includeTime: boolean = false
  ): string => {
    if (!date) return 'N/A'; // Handle null, undefined, empty string
    
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    const locale = language === "pl" ? "pl-PL" : "en-US";

    if (includeTime) {
      return `${dateObj.toLocaleDateString(
        locale, { timeZone: 'UTC' }
      )} ${dateObj.toLocaleTimeString(locale, { timeZone: 'UTC' })}`;
    }

    return dateObj.toLocaleDateString(locale, { timeZone: 'UTC' });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
