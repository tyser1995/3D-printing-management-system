'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Upload, DatabaseBackup, CloudUpload, CloudDownload, Cloud } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface Props {
  dbSource: 'sqlite' | 'postgres'
}

type SyncStatus = 'checking' | 'not_configured' | 'connected' | 'unreachable'

export default function BackupManager({ dbSource }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('checking')
  const [pushing, setPushing] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    fetch('/api/admin/sync/status')
      .then((r) => r.json())
      .then((json) => {
        if (!json.data?.configured) setSyncStatus('not_configured')
        else setSyncStatus(json.data.connected ? 'connected' : 'unreachable')
      })
      .catch(() => setSyncStatus('unreachable'))
  }, [])

  const handlePush = async () => {
    const confirmed = confirm(
      'This will REPLACE all data on Supabase with your current local data. This cannot be undone. Continue?'
    )
    if (!confirmed) return
    setPushing(true)
    setSyncMessage(null)
    try {
      const res = await fetch('/api/admin/sync/push', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setSyncMessage({ type: 'success', text: `Pushed ${json.data.total} records to Supabase.` })
      } else {
        setSyncMessage({ type: 'error', text: json.error ?? 'Push failed' })
      }
    } finally {
      setPushing(false)
    }
  }

  const handlePull = async () => {
    const confirmed = confirm(
      `This will REPLACE all data in your current database (${dbSource}) with what's on Supabase. This cannot be undone. Continue?`
    )
    if (!confirmed) return
    setPulling(true)
    setSyncMessage(null)
    try {
      const res = await fetch('/api/admin/sync/pull', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setSyncMessage({
          type: 'success',
          text: `Pulled ${json.data.total} records from Supabase.`,
        })
      } else {
        setSyncMessage({ type: 'error', text: json.error ?? 'Pull failed' })
      }
    } finally {
      setPulling(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/backup/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="(.+)"/)
      const filename = match?.[1] ?? `kai3d-backup-${new Date().toISOString().slice(0, 10)}.json`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: `Exported ${filename}` })
    } catch {
      setMessage({ type: 'error', text: 'Failed to export backup' })
    } finally {
      setExporting(false)
    }
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const confirmed = confirm(
      `This will REPLACE all data in the current database (${dbSource}) with the contents of "${file.name}". This cannot be undone. Continue?`
    )
    if (!confirmed) return

    setImporting(true)
    setMessage(null)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const res = await fetch('/api/admin/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      })
      const result = await res.json()
      if (res.ok) {
        const total = Object.values(result.data.counts as Record<string, number>).reduce(
          (a, b) => a + b,
          0
        )
        setMessage({
          type: 'success',
          text: `Restored ${total} records to ${result.data.restoredTo}.`,
        })
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Import failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Invalid backup file' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Backup</CardTitle>
        <Badge variant="info" size="sm">
          <DatabaseBackup className="mr-1 inline h-3 w-3" />
          {dbSource === 'sqlite' ? 'Local SQLite' : 'Supabase (Postgres)'}
        </Badge>
      </CardHeader>

      <p className="mb-4 text-sm text-slate-500">
        Export a full JSON snapshot of the current database, or restore one previously exported.
        Export/import always target whichever database{' '}
        <code className="rounded bg-slate-100 px-1">DATABASE_URL</code> currently points to &mdash;
        local SQLite in dev, Supabase in production.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleExport} loading={exporting} variant="outline">
          <Download className="h-4 w-4" /> Export JSON
        </Button>
        <Button onClick={handleImportClick} loading={importing} variant="outline">
          <Upload className="h-4 w-4" /> Import JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {message && (
        <p
          className={`mt-3 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}
        >
          {message.text}
        </p>
      )}

      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Cloud className="h-4 w-4" /> Cloud Sync
          </h4>
          <Badge
            variant={
              syncStatus === 'connected'
                ? 'success'
                : syncStatus === 'unreachable'
                  ? 'danger'
                  : 'default'
            }
            size="sm"
          >
            {syncStatus === 'checking' && 'Checking...'}
            {syncStatus === 'not_configured' && 'Not configured'}
            {syncStatus === 'connected' && 'Connected'}
            {syncStatus === 'unreachable' && 'Unreachable'}
          </Badge>
        </div>

        {syncStatus === 'not_configured' ? (
          <p className="text-sm text-slate-500">
            Set <code className="rounded bg-slate-100 px-1">SUPABASE_SYNC_DATABASE_URL</code> in
            your <code className="rounded bg-slate-100 px-1">.env.local</code> to push or pull a
            live copy of your data on Supabase, without downloading a file.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-500">
              Push replaces Supabase with your current data; pull replaces your current data with
              what&apos;s on Supabase.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handlePush}
                loading={pushing}
                variant="outline"
                disabled={syncStatus !== 'connected'}
              >
                <CloudUpload className="h-4 w-4" /> Push to Supabase
              </Button>
              <Button
                onClick={handlePull}
                loading={pulling}
                variant="outline"
                disabled={syncStatus !== 'connected'}
              >
                <CloudDownload className="h-4 w-4" /> Pull from Supabase
              </Button>
            </div>
          </>
        )}

        {syncMessage && (
          <p
            className={`mt-3 text-sm ${syncMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}
          >
            {syncMessage.text}
          </p>
        )}
      </div>
    </Card>
  )
}
