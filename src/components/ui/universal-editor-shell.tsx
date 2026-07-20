'use client'

import { ReactNode } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import { cn } from '@/lib/utils'

export interface UniversalEditorShellProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  onSave?: () => void
  isSaving?: boolean
  saveText?: string
  hideFooter?: boolean
  maxWidth?: string // e.g. 'max-w-xl', 'max-w-3xl', 'max-w-4xl'
}

export function UniversalEditorShell({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  onSave,
  isSaving = false,
  saveText = 'Save Changes',
  hideFooter = false,
  maxWidth = 'max-w-2xl'
}: UniversalEditorShellProps) {
  return (
    <DialogModal
      open={isOpen}
      onClose={onClose}
      className={cn(
        'w-full bg-white dark:bg-[#161B22] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#30363D] flex flex-col max-h-[90vh] overflow-hidden text-slate-900 dark:text-white p-0 relative',
        maxWidth
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#30363D] shrink-0 bg-slate-50/50 dark:bg-[#0D1117]/50">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h2>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {children}
      </div>

      {/* Footer */}
      {!hideFooter && (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-[#30363D] bg-slate-50/50 dark:bg-[#0D1117]/50 shrink-0 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-[#161B22] dark:border-[#30363D] dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saveText}
          </button>
        </div>
      )}
    </DialogModal>
  )
}
