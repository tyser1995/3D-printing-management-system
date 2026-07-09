'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Cpu, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'

const PRODUCT_TYPES = [
  { id: 'keychain', label: 'Keychain', emoji: '🔑', desc: 'Flat ring attachment, 6cm' },
  { id: 'clicker', label: 'Clicker', emoji: '🖱️', desc: 'Push-button tactile fidget' },
  { id: 'keycap', label: 'Keycap', emoji: '⌨️', desc: 'MX-compatible switch cap' },
  { id: 'nameplate', label: 'Nameplate', emoji: '🪧', desc: 'Desk sign, custom text' },
] as const

type ProductType = (typeof PRODUCT_TYPES)[number]['id']
type Stage = 'idle' | 'uploading' | 'generating' | 'done' | 'error'

interface Result {
  taskId: string
  previewUrl: string
  downloadUrl: string
  format: string
  message: string
}

export default function AiLabClient() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [productType, setProductType] = useState<ProductType>('keychain')
  const [stage, setStage] = useState<Stage>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const handleFile = (f: File) => {
    if (!f.type.match(/image\/(png|jpeg|svg)/)) {
      setErrorMsg('Only PNG, JPG, and SVG files are accepted.')
      return
    }
    setFile(f)
    setResult(null)
    setErrorMsg('')
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const generate = async () => {
    if (!file) return
    setStage('generating')
    setErrorMsg('')

    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('productType', productType)

      const res = await fetch('/api/lab/generate', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? 'Generation failed')

      setResult(json.data)
      setStage('done')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Generation failed')
      setStage('error')
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setStage('idle')
    setErrorMsg('')
  }

  return (
    <div className="space-y-8">
      {/* Step 1: Upload */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold">
            1
          </span>
          Upload Image
        </h2>

        {!file ? (
          <div
            ref={dropRef}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-600 bg-slate-900/50 p-12 text-center transition-colors hover:border-orange-500"
          >
            <Upload className="h-10 w-10 text-slate-500" />
            <div>
              <p className="font-medium text-slate-300">Drop your image here or click to browse</p>
              <p className="mt-1 text-sm text-slate-500">PNG, JPG, SVG — max 10 MB</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="h-20 w-20 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{file.name}</p>
              <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              onClick={reset}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {errorMsg && (
          <p className="mt-3 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" /> {errorMsg}
          </p>
        )}
      </div>

      {/* Step 2: Product type */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold">
            2
          </span>
          Choose Product Type
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PRODUCT_TYPES.map((pt) => (
            <button
              key={pt.id}
              onClick={() => setProductType(pt.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                productType === pt.id
                  ? 'border-orange-500 bg-orange-500/10 text-orange-300'
                  : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              <span className="text-3xl">{pt.emoji}</span>
              <span className="font-semibold">{pt.label}</span>
              <span className="text-xs opacity-75">{pt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Generate */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold">
            3
          </span>
          Generate 3D Model
        </h2>

        {stage !== 'done' ? (
          <Button
            size="lg"
            fullWidth
            disabled={!file || stage === 'generating'}
            loading={stage === 'generating'}
            onClick={generate}
            className="text-base"
          >
            {stage === 'generating' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Generating model…
              </>
            ) : (
              <>
                <Cpu className="h-5 w-5" /> Generate {productType} 3D Model
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <CheckCircle2 className="h-6 w-6 text-green-400" />
              <div>
                <p className="font-semibold text-green-300">Model ready!</p>
                <p className="text-sm text-slate-400">{result?.message}</p>
              </div>
            </div>

            {result?.previewUrl && (
              <div className="overflow-hidden rounded-xl border border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.previewUrl} alt="3D preview" className="w-full" />
              </div>
            )}

            <div className="flex gap-3">
              <a
                href={result?.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
              >
                <Download className="h-5 w-5" />
                Download {result?.format}
              </a>
              <Button
                variant="outline"
                onClick={reset}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Start Over
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
