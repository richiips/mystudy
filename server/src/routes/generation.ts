import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { extractTextFromPdf } from '../services/pdfService';
import { extractTextFromUrl } from '../services/scraperService';
import { extractTranscript } from '../services/youtubeService';
import { generateCourseStructure, generateSummary, generateQuestions } from '../services/aiService';
import { generateAudio } from '../services/ttsService';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

// POST / - Main generation endpoint
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { url, sourceType } = req.body;
    const file = req.file;

    // Validate input
    if (!file && !url) {
      res.status(400).json({ error: 'Debes proporcionar un archivo PDF o una URL' });
      return;
    }

    let resolvedSourceType: 'pdf' | 'article' | 'video';

    if (file) {
      resolvedSourceType = 'pdf';
    } else if (sourceType === 'video' || sourceType === 'article') {
      resolvedSourceType = sourceType;
    } else {
      res.status(400).json({ error: 'Tipo de fuente inválido. Usa "article" o "video"' });
      return;
    }

    // Create course record with processing status
    const { data: course, error: createError } = await supabase
      .from('courses')
      .insert({
        user_id: userId,
        title: 'Procesando...',
        source_type: resolvedSourceType,
        source_url: url || null,
        status: 'processing',
      })
      .select()
      .single();

    if (createError || !course) {
      res.status(500).json({ error: 'Error al crear el curso' });
      return;
    }

    // Return course ID immediately
    res.status(201).json({ id: course.id, status: 'processing' });

    // Process in background
    processCourse(course.id, resolvedSourceType, file?.buffer, url).catch(
      async (err) => {
        console.error(`Error procesando curso ${course.id}:`, err);
        await supabase
          .from('courses')
          .update({ status: 'error' })
          .eq('id', course.id);
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar la generación del curso' });
  }
});

async function processCourse(
  courseId: string,
  sourceType: 'pdf' | 'article' | 'video',
  fileBuffer?: Buffer,
  url?: string
): Promise<void> {
  // Step 1: Extract text based on source type
  console.log(`[${courseId}] Paso 1: Extrayendo texto (${sourceType})...`);
  let extractedText: string;

  switch (sourceType) {
    case 'pdf':
      if (!fileBuffer) throw new Error('No se proporcionó archivo PDF');
      extractedText = await extractTextFromPdf(fileBuffer);
      break;
    case 'article':
      if (!url) throw new Error('No se proporcionó URL del artículo');
      extractedText = await extractTextFromUrl(url);
      break;
    case 'video':
      if (!url) throw new Error('No se proporcionó URL del video');
      extractedText = await extractTranscript(url);
      break;
  }
  console.log(`[${courseId}] Texto extraído: ${extractedText.length} caracteres`);

  // Step 2: Generate course structure with AI
  console.log(`[${courseId}] Paso 2: Generando estructura del curso con IA...`);
  const courseStructure = await generateCourseStructure(extractedText);
  console.log(`[${courseId}] Estructura generada: "${courseStructure.title}" (${courseStructure.chapters.length} capítulos)`);

  // Step 3: Update course title
  await supabase
    .from('courses')
    .update({ title: courseStructure.title })
    .eq('id', courseId);

  // Step 4: Process each chapter sequentially
  for (let i = 0; i < courseStructure.chapters.length; i++) {
    const chapter = courseStructure.chapters[i];
    console.log(`[${courseId}] Paso 4.${i + 1}: Procesando capítulo "${chapter.title}"...`);

    // Generate summary and questions in parallel, audio separately (can fail)
    const [summary, questions] = await Promise.all([
      generateSummary(chapter.title, chapter.content),
      generateQuestions(chapter.title, chapter.content),
    ]);
    console.log(`[${courseId}] Capítulo ${i + 1}: resumen y preguntas generados`);

    // Audio is optional - don't fail the whole course if TTS fails
    let audioUrl: string | null = null;
    try {
      audioUrl = await generateAudio(summary.slice(0, 4096), courseId, i);
      console.log(`[${courseId}] Capítulo ${i + 1}: audio generado`);
    } catch (audioErr) {
      console.error(`[${courseId}] Capítulo ${i + 1}: error generando audio (continuando sin audio):`, audioErr);
    }

    // Insert chapter
    const { data: chapterData, error: chapterError } = await supabase
      .from('chapters')
      .insert({
        course_id: courseId,
        title: chapter.title,
        summary,
        audio_url: audioUrl,
        order_index: i,
      })
      .select()
      .single();

    if (chapterError || !chapterData) {
      throw new Error(`Error al insertar capítulo: ${chapterError?.message}`);
    }

    // Insert questions for this chapter
    if (questions.length > 0) {
      const questionsToInsert = questions.map((q) => ({
        chapter_id: chapterData.id,
        question: q.question,
        options: q.options,
        correct_index: q.correctIndex,
        explanation: q.explanation,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) {
        throw new Error(`Error al insertar preguntas: ${questionsError.message}`);
      }
    }
    console.log(`[${courseId}] Capítulo ${i + 1} completado`);
  }

  // Step 5: Update course status to ready
  await supabase
    .from('courses')
    .update({ status: 'ready' })
    .eq('id', courseId);
  console.log(`[${courseId}] Curso completado!`);
}

export default router;
