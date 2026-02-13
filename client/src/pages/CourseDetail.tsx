import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { apiUrl } from '../lib/api'
import ChapterView from '../components/ChapterView'

interface Question {
  id: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

interface Chapter {
  id: string
  title: string
  summary: string
  audio_url: string | null
  questions: Question[]
}

interface Course {
  id: string
  title: string
  source_type: string
  status: string
  chapters: Chapter[]
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(apiUrl(`/api/courses/${id}`), {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        })

        if (!res.ok) {
          throw new Error('Error al cargar el curso')
        }

        const data = await res.json()
        setCourse(data)
      } catch {
        setError('No se pudo cargar el curso')
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-center text-red-700 border border-red-200">
        {error || 'Curso no encontrado'}
      </div>
    )
  }

  const selectedChapter = course.chapters[selectedChapterIndex]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{course.title}</h1>

      {/* Mobile chapter selector */}
      <div className="mb-4 lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700"
        >
          <span>
            Capítulo {selectedChapterIndex + 1}: {selectedChapter?.title}
          </span>
          <svg
            className={`h-5 w-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {sidebarOpen && (
          <div className="mt-2 rounded-lg border border-gray-200 bg-white shadow-lg">
            {course.chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => {
                  setSelectedChapterIndex(index)
                  setSidebarOpen(false)
                }}
                className={`block w-full px-4 py-3 text-left text-sm transition-colors ${
                  index === selectedChapterIndex
                    ? 'bg-indigo-50 font-medium text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${index !== course.chapters.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <span className="text-xs text-gray-400">Capítulo {index + 1}</span>
                <br />
                {chapter.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <nav className="sticky top-8 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Capítulos
              </h2>
            </div>
            {course.chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => setSelectedChapterIndex(index)}
                className={`block w-full px-4 py-3 text-left text-sm transition-colors ${
                  index === selectedChapterIndex
                    ? 'bg-indigo-50 font-medium text-indigo-700 border-l-2 border-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${index !== course.chapters.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <span className="text-xs text-gray-400">Capítulo {index + 1}</span>
                <br />
                {chapter.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Chapter content */}
        <div className="min-w-0 flex-1">
          {selectedChapter && (
            <ChapterView
              chapter={selectedChapter}
              questions={selectedChapter.questions}
            />
          )}
        </div>
      </div>
    </div>
  )
}
