import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateAudio(
  text: string,
  courseId: string,
  chapterIndex: number
): Promise<string> {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text,
  });

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const filePath = `${courseId}/chapter-${chapterIndex}.mp3`;

  const { error: uploadError } = await supabase.storage
    .from('audio')
    .upload(filePath, buffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Error al subir audio: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from('audio').getPublicUrl(filePath);

  return data.publicUrl;
}
