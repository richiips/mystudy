import { useState, FormEvent, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { apiUrl } from '../lib/api'

type SourceTab = 'pdf' | 'article' | 'video'

export default function NewCourse() {
  const [activeTab, setActiveTab] = useState<SourceTab>('pdf')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const tabs: { key: SourceTab; label: string }[] = [
    { key: 'pdf', label: 'PDF' },
    { key: 'article', label: 'Artículo' },
    { key: 'video', label: 'Video de YouTube' },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.size > 20 * 1024 * 1024) {
        setError('El archivo no puede superar los 20MB')
        return
      }
      setFile(selected)
      setError('')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (activeTab === 'pdf' && !file) {
      setError('Selecciona un archivo PDF')
      return
    }

    if ((activeTab === 'article' || activeTab === 'video') && !url.trim()) {
      setError('Ingresa una URL válida')
      return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      let res: Response

      if (activeTab === 'pdf') {
        const formData = new FormData()
        formData.append('file', file!)
        formData.append('sourceType', 'pdf')

        res = await fetch(apiUrl('/api/generation'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })
      } else {
        res = await fetch(apiUrl('/api/generation'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            url: url.trim(),
            sourceType: activeTab,
          }),
        })
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Error al generar el curso')
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Nuevo Curso</h1>

      <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100">
        {/* Tabs */}
        <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                setError('')
                setUrl('')
                setFile(null)
              }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* PDF Upload */}
          {activeTab === 'pdf' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo PDF
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-indigo-400 hover:bg-indigo-50/50"
              >
                <svg
                  className="mb-3 h-10 w-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                {file ? (
                  <p className="text-sm font-medium text-indigo-600">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-600">
                      Haz clic para seleccionar un PDF
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Máximo 20MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Article URL */}
          {activeTab === 'article' && (
            <div>
              <label htmlFor="articleUrl" className="block text-sm font-medium text-gray-700 mb-1">
                URL del artículo
              </label>
              <input
                id="articleUrl"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                placeholder="https://ejemplo.com/articulo"
              />
            </div>
          )}

          {/* Video URL */}
          {activeTab === 'video' && (
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                URL del video de YouTube
              </label>
              <input
                id="videoUrl"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generando...
              </span>
            ) : (
              'Generar Curso'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
