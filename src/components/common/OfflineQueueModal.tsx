/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Offline Mutation Queue Inspector & Sync Controller
 * Displays all local uncommitted transactions buffered on the device with manual sync triggers.
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  getPendingMutations,
  drainMutationQueue,
  clearMutationQueue,
  removeMutation,
  subscribeQueue,
  type QueuedMutation
} from '../../services/offlineQueue.ts';
import {
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from './ToastContext.tsx';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { showSuccess, showError, showWarning } = useToast();
  const { isSyncing, syncWithServer } = useBakeryStore();

  const [mutations, setMutations] = useState<QueuedMutation[]>(() => getPendingMutations());
  const [isDraining, setIsDraining] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setMutations(getPendingMutations());
    const unsub = subscribeQueue((q) => {
      setMutations([...q]);
    });
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDrainNow = async () => {
    if (!isOnline) {
      showWarning(
        language === 'am' ? 'ኢንተርኔት የለም' : 'Device Offline',
        language === 'am'
          ? 'እባክዎ መጀመሪያ ኢንተርኔት ወይም ዋይፋይ ያገናኙ።'
          : 'Please connect to internet before syncing.'
      );
      return;
    }

    try {
      setIsDraining(true);
      const res = await drainMutationQueue();
      await syncWithServer();
      setMutations(getPendingMutations());
      if (res.errors.length > 0) {
        showWarning(
          language === 'am' ? 'ከፊል ስህተት ተከስቷል' : 'Partial Sync',
          language === 'am'
            ? `${res.processed} ተሳክተዋል፤ ${res.errors.length} ስህተት አጋጥሟቸዋል።`
            : `Processed ${res.processed} operations; ${res.errors.length} errors.`
        );
      } else {
        showSuccess(
          language === 'am' ? 'ማመሳሰል ተጠናቋል!' : 'Sync Completed!',
          language === 'am'
            ? `ሁሉም ${res.processed} ለውጦች ወደ ዳታቤዝ ተልከዋል!`
            : `Successfully flushed all ${res.processed} queued operations to the database!`
        );
      }
    } catch (err: any) {
      showError('Sync Error', err?.message || 'Failed to drain offline queue');
    } finally {
      setIsDraining(false);
    }
  };

  const handleRemove = (id: string, desc: string) => {
    removeMutation(id);
    setMutations(getPendingMutations());
    showWarning(
      language === 'am' ? 'ተሰርዟል' : 'Item Removed',
      language === 'am' ? `"${desc}" ከመጠባበቂያ ዝርዝር ተሰርዟል` : `Removed "${desc}" from queue`
    );
  };

  const handleClearAll = () => {
    if (confirm(language === 'am' ? 'እርግጠኛ ነዎት ሁሉንም ያልተላኩ ለውጦች መሰረዝ ይፈልጋሉ?' : 'Are you sure you want to discard all queued offline changes?')) {
      clearMutationQueue();
      setMutations([]);
      showWarning(
        language === 'am' ? 'ዝርዝር ጸድቷል' : 'Queue Cleared',
        language === 'am' ? 'ሁሉም ያልተላኩ ለውጦች ተሰርዘዋል።' : 'All queued offline mutations cleared.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-xs">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isOnline ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <span>{language === 'am' ? 'ከመስመር ውጭ የለውጦች ዝርዝር (Offline Queue)' : 'Offline Mutation Queue'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
                  {mutations.length}
                </span>
              </h2>
              <p className="text-stone-400 text-[11px]">
                {isOnline
                  ? (language === 'am' ? 'የኢንተርኔት ግንኙነት አለ - ዳታቤዝ ጋር ማመሳሰል ይቻላል' : 'Device is online and ready to sync with backend')
                  : (language === 'am' ? 'ኢንተርኔት የለም - ለውጦች በስልኩ ላይ ተቀምጠዋል' : 'Offline mode: changes are safely buffered in local storage')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Status summary banner */}
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
            mutations.length > 0
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
              : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {mutations.length > 0 ? (
                <Database className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="text-xs font-medium">
                {mutations.length > 0
                  ? language === 'am'
                    ? `${mutations.length} ያልተላኩ ለውጦች በቅደም ተከተል ተቀምጠዋል`
                    : `${mutations.length} pending local mutations awaiting server sync`
                  : language === 'am'
                  ? 'ሁሉም ለውጦች ከዳታቤዝ ጋር ተመሳስለዋል!'
                  : 'All local changes are fully synced with server database!'}
              </span>
            </div>

            {mutations.length > 0 && isOnline && (
              <button
                disabled={isDraining || isSyncing}
                onClick={handleDrainNow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
              >
                <Send className={`w-3.5 h-3.5 ${(isDraining || isSyncing) ? 'animate-spin' : ''}`} />
                <span>{language === 'am' ? 'አሁን ላክ' : 'Sync All Now'}</span>
              </button>
            )}
          </div>

          {/* Mutation list */}
          {mutations.length > 0 ? (
            <div className="space-y-2">
              {mutations.map((item, idx) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-stone-850 border border-stone-800 rounded-xl p-3 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[10px] text-stone-500 shrink-0">
                          #{idx + 1}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                          item.method === 'POST'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : item.method === 'PATCH' || item.method === 'PUT'
                            ? 'bg-sky-950 text-sky-400 border border-sky-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {item.method}
                        </span>
                        <span className="font-medium text-stone-200 truncate text-xs" title={item.description}>
                          {item.description}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="p-1 rounded text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
                          title="View JSON payload"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleRemove(item.id, item.description)}
                          className="p-1 rounded text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition cursor-pointer"
                          title="Discard this item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-800/60 font-mono">
                      <span>Endpoint: {item.endpoint}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-500" />
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        {item.retryCount > 0 && <span className="text-amber-400">({item.retryCount} retries)</span>}
                      </span>
                    </div>

                    {isExpanded && item.body && (
                      <div className="mt-2 p-2 bg-stone-900 rounded-lg border border-stone-800 text-[10px] font-mono text-stone-300 overflow-x-auto max-h-36">
                        <pre>{JSON.stringify(item.body, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="font-semibold text-stone-200 text-sm">
                {language === 'am' ? 'ምንም ያልተላከ ለውጥ የለም' : 'Queue is Clear'}
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {language === 'am'
                  ? 'ትዕዛዞች ወይም ክፍያዎች ከመስመር ውጭ ሲመዘገቡ በዚህ ዝርዝር ውስጥ ይቆያሉ፤ ኢንተርኔት ሲገኝ በራሱ ይላካሉ።'
                  : 'Orders, payments, or customer changes created while offline are automatically buffered here and synced when connection restores.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800 flex items-center justify-between bg-stone-850 shrink-0">
          <div>
            {mutations.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-stone-400 hover:text-rose-400 text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'ሁሉንም ሰርዝ' : 'Clear All'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold transition cursor-pointer"
            >
              {language === 'am' ? 'ዝጋ' : 'Close'}
            </button>
            {mutations.length > 0 && (
              <button
                disabled={!isOnline || isDraining || isSyncing}
                onClick={handleDrainNow}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${(isDraining || isSyncing) ? 'animate-spin' : ''}`} />
                <span>{language === 'am' ? 'አመሳስል' : 'Sync Queue'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
