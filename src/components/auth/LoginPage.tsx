/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Bakery Owner & Staff Login Screen
 * High-fidelity, responsive authentication view supporting Amharic and English.
 */

import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext.tsx';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useTheme } from '../../theme/useTheme.tsx';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const [phone, setPhone] = useState('0955143592');
  const [password, setPassword] = useState('Yibe51@@');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      setErrorMessage(language === 'am' ? 'እባክዎ ስልክ ቁጥር እና የይለፍ ቃል ያስገቡ' : 'Please provide both phone number and password');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await login(phone.trim(), password.trim(), rememberMe);
    } catch (err: any) {
      console.error('[Login Error]', err);
      setErrorMessage(
        err.message || (language === 'am' ? 'የተሳሳተ ስልክ ቁጥር ወይም የይለፍ ቃል' : 'Invalid phone number or password')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillOwner = () => {
    setPhone('0955143592');
    setPassword('Yibe51@@');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-stone-950 text-stone-100 p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top right utility toggles (Theme & Language) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-10">
        <button
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle Theme"
          className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 border border-stone-800 transition shadow-xs cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-amber-500" />}
        </button>
        <button
          onClick={toggleLanguage}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-800 text-xs font-semibold transition shadow-xs cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === 'am' ? 'English' : 'አማርኛ'}</span>
        </button>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-stone-900/90 border border-stone-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-md relative z-10">
        
        {/* Bakery Header Branding */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-black text-3xl shadow-lg shadow-amber-500/20 mb-3.5 ring-4 ring-amber-500/20">
            ይ
          </div>
          <h1 className="text-2xl font-black tracking-tight text-stone-100">
            {language === 'am' ? 'ይበልጣል ዳቦ ቤት' : 'Yibeltal Bakery'}
          </h1>
          <p className="text-xs text-amber-400 font-semibold mt-1">
            {t.signInSubtitle}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">
            {language === 'am' ? 'የባለቤት እና አስተዳደር መግቢያ' : 'Owner & Operations Portal'}
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Phone Field */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              {t.phoneLabel}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Phone className="w-4 h-4 text-amber-400" />
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0955143592"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-950/80 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition font-medium"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-300">
                {t.passwordLabel}
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 bg-stone-950/80 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Quick Fill Owner */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-stone-950 border-stone-700"
              />
              <span className="text-xs text-stone-300 font-medium">
                {t.rememberMe}
              </span>
            </label>

            <button
              type="button"
              onClick={handleQuickFillOwner}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{language === 'am' ? 'ባለቤት ሙላ' : 'Owner Autofill'}</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-stone-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                <span>{t.signingIn}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{t.signInButton}</span>
              </>
            )}
          </button>
        </form>

        {/* Security badge and hint */}
        <div className="mt-6 pt-5 border-t border-stone-800/80 flex items-center justify-center gap-2 text-[11px] text-stone-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {language === 'am'
              ? 'የተጠበቀ ክፍለ ጊዜ • ከመስመር ውጭ ይሰራል'
              : 'Secure encrypted session • Works seamlessly offline'}
          </span>
        </div>

      </div>

      {/* Footer copyright */}
      <footer className="mt-6 text-center text-xs text-stone-400">
        © {new Date().getFullYear()} Yibeltal Bakery. All rights reserved.
      </footer>
    </div>
  );
};
