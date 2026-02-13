import { Link } from 'react-router-dom'

interface Course {
  id: string
  title: string
  source_type: string
  status: string
  created_at: string
}

const sourceTypeLabels: Record<string, string> = {
  pdf: 'PDF',
  article: 'Artículo',
  video: 'Video',
}

const sourceTypeColors: Record<string, string> = {
  pdf: 'bg-red-100 text-red-700',
  article: 'bg-blue-100 text-blue-700',
  video: 'bg-purple-100 text-purple-700',
}

export default function CourseCard({ course }: { course: Course }) {
  const isReady = course.status === 'ready'

  const formattedDate = new Date(course.created_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const content = (
    <div
      className={`rounded-xl bg-white p-5 shadow-md border border-gray-100 transition-all ${
        isReady ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : 'opacity-80'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            sourceTypeColors[course.source_type] || 'bg-gray-100 text-gray-700'
          }`}
        >
          {sourceTypeLabels[course.source_type] || course.source_type}
        </span>
        {isReady ? (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Listo
          </span>
        ) : (
          <span className="animate-pulse rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
            Procesando...
          </span>
        )}
      </div>

      <h3 className="mb-3 text-lg font-semibold text-gray-900 line-clamp-2">
        {course.title}
      </h3>

      <p className="text-sm text-gray-500">{formattedDate}</p>
    </div>
  )

  if (isReady) {
    return <Link to={`/course/${course.id}`}>{content}</Link>
  }

  return content
}
