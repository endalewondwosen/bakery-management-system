/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  MessageSquareWarning,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  RotateCcw,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  Save,
} from 'lucide-react';
import { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus, ResolutionType } from '../../types/domain.ts';
import { useToast } from '../common/ToastContext.tsx';

interface ComplaintsViewProps {
  onOpenNewComplaint: () => void;
  onSelectCustomer: (customerId: string) => void;
}

export const ComplaintsView: React.FC<ComplaintsViewProps> = ({
  onOpenNewComplaint,
  onSelectCustomer,
}) => {
  const { t, language } = useLanguage();
  const { showSuccess } = useToast();
  const { complaints, resolveComplaint, updateComplaintStatus, updateComplaint, deleteComplaint } = useBakeryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Resolving complaint modal state
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionType, setResolutionType] = useState<ResolutionType>('REPLACEMENT');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Editing complaint modal state
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [editCategory, setEditCategory] = useState<ComplaintCategory>('BREAD_QUALITY');
  const [editPriority, setEditPriority] = useState<ComplaintPriority>('HIGH');
  const [editDescription, setEditDescription] = useState('');
  const [editQtyAffected, setEditQtyAffected] = useState<number>(0);

  // Deleting complaint state
  const [complaintToDelete, setComplaintToDelete] = useState<Complaint | null>(null);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matches =
        !searchTerm.trim() ||
        c.complaintNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);

      if (!matches) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;

      return true;
    });
  }, [complaints, searchTerm, statusFilter]);

  const handleConfirmResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingId || !resolutionNotes.trim()) return;

    resolveComplaint(resolvingId, resolutionType, resolutionNotes, 'Bakery Owner');
    setResolvingId(null);
    setResolutionNotes('');
  };

  const handleStartEdit = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    setEditCategory(complaint.category);
    setEditPriority(complaint.priority);
    setEditDescription(complaint.description);
    setEditQtyAffected(complaint.quantityAffected || 0);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplaint || !editDescription.trim()) return;

    updateComplaint(editingComplaint.id, {
      category: editCategory,
      priority: editPriority,
      description: editDescription.trim(),
      quantityAffected: editQtyAffected > 0 ? editQtyAffected : undefined,
    });

    showSuccess(
      language === 'am' ? 'ቅሬታ ተሻሽሏል!' : 'Complaint Updated!',
      language === 'am'
        ? `ቅሬታ ${editingComplaint.complaintNumber} መረጃ ተሻሽሏል`
        : `Complaint ${editingComplaint.complaintNumber} has been updated`
    );

    setEditingComplaint(null);
  };

  return (
    <div className="space-y-5">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-rose-500" />
            <span>{t.navComplaints}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
              {filteredComplaints.length}
            </span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {language === 'am'
              ? 'የዳቦ ጥራት፣ ብዛት ወይም የማድረስ ቅሬታዎች እና የመፍትሄ ክትትል (Section 24-29)'
              : 'Customer feedback, bread quality issues, order discrepancies and resolution tracking'}
          </p>
        </div>

        <button
          onClick={onOpenNewComplaint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow transition shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.fileComplaint}</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'am' ? 'ቅሬታ ቁጥር፣ ደንበኛ ወይም ችግር ፈልግ...' : 'Search complaint #, customer, issue...'}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none"
          >
            <option value="ALL">{language === 'am' ? 'ሁሉም የቅሬታ ሁኔታዎች' : 'All Complaint States'}</option>
            <option value="OPEN">{t.statusOpen}</option>
            <option value="UNDER_REVIEW">{t.statusUnderReview}</option>
            <option value="ACTION_TAKEN">{t.statusActionTaken}</option>
            <option value="RESOLVED">{t.statusResolved}</option>
            <option value="CLOSED">{t.statusClosed}</option>
          </select>
        </div>
      </div>

      {/* Complaints Cards / Table */}
      <div className="space-y-3">
        {filteredComplaints.length === 0 ? (
          <div className="py-12 text-center text-stone-500 text-xs bg-stone-900 border border-stone-800 rounded-xl">
            <CheckCircle className="w-8 h-8 mx-auto text-emerald-500/40 mb-2" />
            {language === 'am' ? 'ምንም የሚዛመድ ቅሬታ አልተገኘም' : 'No matching complaints found'}
          </div>
        ) : (
          filteredComplaints.map((c) => (
            <div
              key={c.id}
              className="bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-xl p-4 transition shadow-sm text-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {c.complaintNumber}
                  </span>
                  <span className="text-stone-500">·</span>
                  <button
                    onClick={() => onSelectCustomer(c.customerId)}
                    className="font-bold text-stone-100 hover:text-amber-400 text-left"
                  >
                    {c.customerName}
                  </button>
                  {c.orderNumber && (
                    <span className="text-stone-400 font-mono text-[11px]">
                      (Order: {c.orderNumber})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    c.priority === 'URGENT' || c.priority === 'HIGH'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800/80'
                      : 'bg-stone-800 text-stone-300 border border-stone-700'
                  }`}>
                    {c.priority}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    c.status === 'RESOLVED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                      : 'bg-amber-950 text-amber-400 border border-amber-800/80'
                  }`}>
                    {c.status}
                  </span>
                </div>
              </div>

              <div className="text-stone-300 bg-stone-850/60 p-3 rounded-lg border border-stone-800">
                <div className="text-stone-400 text-[11px] font-semibold mb-1">
                  {c.category} {c.productName && `— ${c.productName}`}
                  {c.quantityAffected ? ` (${c.quantityAffected} pcs affected)` : ''}
                </div>
                <p className="text-stone-200">{c.description}</p>
              </div>

              {/* Resolution details if already resolved */}
              {c.resolutionType && (
                <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-lg p-2.5 text-xs text-stone-300">
                  <div className="flex items-center justify-between text-emerald-400 font-semibold mb-0.5">
                    <span>{language === 'am' ? 'የተወሰደው መፍትሄ:' : 'Resolution:'} {c.resolutionType}</span>
                    <span className="text-[10px] text-stone-500 font-normal">
                      {c.resolvedBy} · {c.resolvedAt ? new Date(c.resolvedAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-stone-300 text-[11px]">{c.resolutionNotes}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                <span className="text-stone-500 text-[11px]">
                  {new Date(c.createdAt).toLocaleString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(c)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-400 transition"
                    title={language === 'am' ? 'ቅሬታ አሻሽል' : 'Edit Complaint'}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setComplaintToDelete(c)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400 transition"
                    title={language === 'am' ? 'ቅሬታ ሰርዝ' : 'Delete Complaint'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {c.status !== 'RESOLVED' && c.status !== 'CLOSED' && (
                    <button
                      onClick={() => setResolvingId(c.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
                    >
                      {language === 'am' ? 'መፍትሄ አስቀምጥ (Resolve)' : 'Resolve Issue'}
                    </button>
                  )}

                  {c.status === 'OPEN' && (
                    <button
                      onClick={() => updateComplaintStatus(c.id, 'UNDER_REVIEW')}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                    >
                      {language === 'am' ? 'በመመርመር ላይ አድርግ' : 'Mark Reviewing'}
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Edit Complaint Modal */}
      {editingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 modal-backdrop-soft">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-5 text-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>{language === 'am' ? 'ቅሬታ ማስተካከያ' : 'Edit Complaint'} ({editingComplaint.complaintNumber})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingComplaint(null)}
                className="text-stone-400 hover:text-stone-100 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  {language === 'am' ? 'የቅሬታ ዓይነት' : 'Issue Category'}
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as ComplaintCategory)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
                >
                  <option value="BREAD_QUALITY">{t.compBreadQuality}</option>
                  <option value="WRONG_QUANTITY">{t.compWrongQuantity}</option>
                  <option value="WRONG_PRODUCT">{t.compWrongProduct}</option>
                  <option value="LATE_DELIVERY">{t.compLateDelivery}</option>
                  <option value="DELIVERY_PROBLEM">{t.compDeliveryProblem}</option>
                  <option value="PACKAGING">{t.compPackaging}</option>
                  <option value="PRICE_BILLING">{t.compPriceBilling}</option>
                  <option value="DAMAGED_PRODUCT">{t.compDamagedProduct}</option>
                  <option value="OTHER">{t.compOther}</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  {language === 'am' ? 'አስፈላጊነት ደረጃ' : 'Priority'}
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as ComplaintPriority)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
                >
                  <option value="LOW">{t.priorityLow}</option>
                  <option value="MEDIUM">{t.priorityMedium}</option>
                  <option value="HIGH">{t.priorityHigh}</option>
                  <option value="URGENT">{t.priorityUrgent}</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  {language === 'am' ? 'የተጎዳ / የጎደለ ብዛት' : 'Quantity Affected'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={editQtyAffected}
                  onChange={(e) => setEditQtyAffected(parseInt(e.target.value) || 0)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  {language === 'am' ? 'የችግሩ ዝርዝር መግለጫ' : 'Description of Issue'} *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingComplaint(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-800 text-stone-300 font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Complaint Confirmation Dialog */}
      {complaintToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 modal-backdrop-soft">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-5 text-xs space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{language === 'am' ? 'ቅሬታ ማጥፋት እርግጠኛ ነዎት?' : 'Confirm Complaint Deletion'}</span>
            </div>

            <p className="text-stone-300 leading-relaxed">
              {language === 'am'
                ? `ቅሬታ ቁጥር "${complaintToDelete.complaintNumber}" (${complaintToDelete.customerName}) ከስርዓቱ በቋሚነት ማጥፋት ይፈልጋሉ?`
                : `Are you sure you want to permanently delete complaint "${complaintToDelete.complaintNumber}" for ${complaintToDelete.customerName}?`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setComplaintToDelete(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteComplaint(complaintToDelete.id);
                  showSuccess(
                    language === 'am' ? 'ቅሬታ ተሰርዟል!' : 'Complaint Deleted!',
                    language === 'am'
                      ? `ቅሬታ ${complaintToDelete.complaintNumber} ተሰርዟል`
                      : `Complaint ${complaintToDelete.complaintNumber} has been deleted`
                  );
                  setComplaintToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow"
              >
                {language === 'am' ? 'አዎ ሰርዝ' : 'Delete Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dialog Modal */}
      {resolvingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 modal-backdrop-soft">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-5 text-xs space-y-4 shadow-2xl">
            <h3 className="font-bold text-stone-100 text-sm">
              {language === 'am' ? 'የቅሬታ መፍትሄ መመዝገቢያ' : 'Record Complaint Resolution'}
            </h3>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የመፍትሄ ዓይነት' : 'Resolution Type'}
              </label>
              <select
                value={resolutionType}
                onChange={(e) => setResolutionType(e.target.value as ResolutionType)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
              >
                <option value="REPLACEMENT">{t.resReplacement}</option>
                <option value="REFUND">{t.resRefund}</option>
                <option value="DISCOUNT">{t.resDiscount}</option>
                <option value="REDELIVERY">{t.resRedelivery}</option>
                <option value="EXPLANATION">{t.resExplanation}</option>
                <option value="NO_ACTION">{t.resNoAction}</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የተወሰደው እርምጃ ማብራሪያ' : 'Resolution Notes & Action Taken'} *
              </label>
              <textarea
                rows={3}
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Sent 30 fresh burger buns with afternoon driver, customer satisfied..."
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolvingId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-stone-800 text-stone-300"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmResolution}
                disabled={!resolutionNotes.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
