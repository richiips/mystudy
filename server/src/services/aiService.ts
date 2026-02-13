import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface Chapter {
  title: string;
  content: string;
}

interface CourseStructure {
  title: string;
  chapters: Chapter[];
}

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export async function generateCourseStructure(
  text: string
): Promise<CourseStructure> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Eres un experto en educación y diseño curricular. Tu tarea es analizar el siguiente texto y dividirlo en un curso estructurado con capítulos.

Debes devolver un JSON con el siguiente formato:
{
  "title": "Título del curso",
  "chapters": [
    {
      "title": "Título del capítulo",
      "content": "Contenido relevante del texto para este capítulo"
    }
  ]
}

Reglas:
- El curso debe tener entre 3 y 8 capítulos
- Cada capítulo debe tener un título descriptivo en español
- El contenido de cada capítulo debe ser una porción relevante del texto original
- El título del curso debe ser descriptivo y en español
- Organiza el contenido de forma lógica y pedagógica`,
      },
      {
        role: 'user',
        content: `Analiza el siguiente texto y crea una estructura de curso:\n\n${text.slice(0, 30000)}`,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No se recibió respuesta de OpenAI');
  }

  return JSON.parse(content) as CourseStructure;
}

export async function generateSummary(
  chapterTitle: string,
  chapterContent: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Eres un profesor experto que crea resúmenes educativos detallados en español.
Tu objetivo es crear un resumen completo y fácil de entender que permita al estudiante aprender el contenido del capítulo.

Reglas:
- Escribe siempre en español
- Usa un tono educativo y accesible
- Incluye los conceptos clave y sus explicaciones
- Organiza la información de forma clara con párrafos bien estructurados
- El resumen debe ser detallado pero conciso
- Incluye ejemplos cuando sea relevante para la comprensión`,
      },
      {
        role: 'user',
        content: `Crea un resumen educativo detallado del siguiente capítulo:

Título: ${chapterTitle}

Contenido:
${chapterContent}`,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No se recibió respuesta de OpenAI');
  }

  return content;
}

export async function generateQuestions(
  chapterTitle: string,
  chapterContent: string
): Promise<Question[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Eres un profesor experto que crea preguntas de opción múltiple para evaluar la comprensión de los estudiantes. Todas las preguntas deben estar en español.

Debes devolver un JSON con el siguiente formato:
{
  "questions": [
    {
      "question": "La pregunta en español",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctIndex": 0,
      "explanation": "Explicación de por qué esta es la respuesta correcta"
    }
  ]
}

Reglas:
- Genera entre 3 y 5 preguntas por capítulo
- Cada pregunta debe tener exactamente 4 opciones
- correctIndex es el índice (0-3) de la respuesta correcta
- Las preguntas deben evaluar comprensión, no solo memorización
- Incluye una explicación clara para cada respuesta correcta
- Todo debe estar en español`,
      },
      {
        role: 'user',
        content: `Crea preguntas de opción múltiple para el siguiente capítulo:

Título: ${chapterTitle}

Contenido:
${chapterContent}`,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No se recibió respuesta de OpenAI');
  }

  const parsed = JSON.parse(content);
  return parsed.questions as Question[];
}
