'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Save, AlertCircle, RefreshCw } from 'lucide-react'

function AdminPageContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')

  const [data, setData] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!type) return
    
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    
    fetch(`/api/admin/content?type=${type}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch data')
        return res.text()
      })
      .then(text => {
        // Pretty print the JSON for editing
        try {
          const json = JSON.parse(text)
          setData(JSON.stringify(json, null, 2))
        } catch (e) {
          setData(text)
        }
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [type])

  const handleSave = async () => {
    if (!type) return
    
    setSaving(true)
    setError(null)
    setSuccessMsg(null)

    try {
      // Validate JSON first
      const parsed = JSON.parse(data)
      
      const res = await fetch(`/api/admin/content?type=${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      })
      
      if (!res.ok) throw new Error('Failed to save data')
      
      setSuccessMsg('Successfully saved!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Invalid JSON format')
    } finally {
      setSaving(false)
    }
  }

  if (!type) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        <div className="text-center">
          <LayoutDashboardIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-medium text-slate-700 dark:text-slate-300">Welcome to Central Admin</h2>
          <p className="mt-2 text-sm">Select a module from the sidebar to manage its data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold capitalize text-slate-900 dark:text-white">{type} Management</h2>
          <p className="text-xs text-slate-500">Edit the raw JSON data for this module</p>
        </div>
        <div className="flex items-center gap-4">
          {error && <span className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4"/> {error}</span>}
          {successMsg && <span className="text-green-500 text-sm">{successMsg}</span>}
          <button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </header>

      {/* Editor Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : (
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="flex-1 w-full resize-none p-4 font-mono text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-slate-300"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center h-full bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-700" />
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  )
}

function LayoutDashboardIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}
