import { useState } from 'react'

interface Question {
  id: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

interface QuizSectionProps {
  questions: Question[]
}

const optionLabels = ['A', 'B', 'C', 'D']

export default function QuizSection({ questions }: QuizSectionProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [checkedQuestions, setCheckedQuestions] = useState<Set<string>>(new Set())

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (checkedQuestions.has(questionId)) return
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleCheck = (questionId: string) => {
    if (selectedAnswers[questionId] === undefined) return
    setCheckedQuestions((prev) => new Set(prev).add(questionId))
  }

  const correctCount = questions.filter(
    (q) => checkedQuestions.has(q.id) && selectedAnswers[q.id] === q.correct_index
  ).length

  const totalChecked = checkedQuestions.size

  return (
    <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100">
      <h3 className="mb-6 text-lg font-bold text-gray-900">
        Verifica tu comprensión
      </h3>

      <div className="space-y-6">
        {questions.map((q, qIndex) => {
          const isChecked = checkedQuestions.has(q.id)
          const selectedIndex = selectedAnswers[q.id]
          const isCorrect = isChecked && selectedIndex === q.correct_index

          return (
            <div
              key={q.id}
              className={`rounded-lg border p-5 ${
                isChecked
                  ? isCorrect
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-red-200 bg-red-50/50'
                  : 'border-gray-200'
              }`}
            >
              <p className="mb-4 font-medium text-gray-900">
                {qIndex + 1}. {q.question}
              </p>

              <div className="space-y-2">
                {q.options.map((option, oIndex) => {
                  let optionStyle = 'border-gray-200 hover:bg-gray-50'

                  if (isChecked) {
                    if (oIndex === q.correct_index) {
                      optionStyle = 'border-green-400 bg-green-50 text-green-800'
                    } else if (oIndex === selectedIndex && oIndex !== q.correct_index) {
                      optionStyle = 'border-red-400 bg-red-50 text-red-800'
                    } else {
                      optionStyle = 'border-gray-200 opacity-60'
                    }
                  } else if (oIndex === selectedIndex) {
                    optionStyle = 'border-indigo-400 bg-indigo-50'
                  }

                  return (
                    <button
                      key={oIndex}
                      onClick={() => handleSelectOption(q.id, oIndex)}
                      disabled={isChecked}
                      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${optionStyle} ${
                        isChecked ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          isChecked && oIndex === q.correct_index
                            ? 'bg-green-200 text-green-800'
                            : isChecked && oIndex === selectedIndex && oIndex !== q.correct_index
                            ? 'bg-red-200 text-red-800'
                            : oIndex === selectedIndex && !isChecked
                            ? 'bg-indigo-200 text-indigo-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {optionLabels[oIndex]}
                      </span>
                      <span>{option}</span>
                    </button>
                  )
                })}
              </div>

              {!isChecked && (
                <button
                  onClick={() => handleCheck(q.id)}
                  disabled={selectedIndex === undefined}
                  className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Verificar
                </button>
              )}

              {isChecked && (
                <div
                  className={`mt-4 rounded-md p-3 text-sm ${
                    isCorrect
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <p className="font-medium mb-1">
                    {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                  </p>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalChecked > 0 && (
        <div className="mt-6 rounded-lg bg-indigo-50 p-4 text-center">
          <p className="text-lg font-semibold text-indigo-700">
            {correctCount} de {totalChecked} correctas
          </p>
          {totalChecked === questions.length && (
            <p className="mt-1 text-sm text-indigo-600">
              {correctCount === questions.length
                ? '¡Excelente! Respondiste todo correctamente.'
                : 'Revisa las explicaciones para mejorar tu comprensión.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
