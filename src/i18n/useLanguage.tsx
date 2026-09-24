/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, UserRole } from '../types/domain.ts';
import { translations } from './translations.ts';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: typeof translations['en'];
  formatCurrency: (amount: number) => string;
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('bakery_lang');
    return (saved === 'am' || saved === 'en') ? saved : 'am'; // Default to Amharic as preferred by bakery owners in Ethiopia
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('bakery_user_role') as UserRole;
    return savedRole || 'OWNER';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('bakery_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'am' : 'en');
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('bakery_user_role', newRole);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language];

  const formatCurrency = (amount: number): string => {
    const formatted = Math.round(amount).toLocaleString();
    return language === 'am' ? `${formatted} ብር` : `${formatted} ETB`;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        formatCurrency,
        role,
        setRole,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
