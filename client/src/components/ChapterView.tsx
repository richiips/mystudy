import AudioPlayer from './AudioPlayer'
import QuizSection from './QuizSection'

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
}

interface ChapterViewProps {
  chapter: Chapter
  questions: Question[]
}

export default function ChapterView({ chapter, questions }: ChapterViewProps) {
  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100">
        <h2 className="mb-4 text-xl font-bold text-gray-900">{chapter.title}</h2>
        <div className="prose max-w-none text-gray-700" style={{ whiteSpace: 'pre-line' }}>
          {chapter.summary}
        </div>
      </div>

      {chapter.audio_url && (
        <AudioPlayer url={chapter.audio_url} title="Audio explicativo" />
      )}

      {questions.length > 0 && <QuizSection questions={questions} />}
    </div>
  )
}
