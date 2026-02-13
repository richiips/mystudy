import { YoutubeTranscript } from 'youtube-transcript';

function extractVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  throw new Error('No se pudo extraer el ID del video de YouTube');
}

export async function extractTranscript(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  const transcript = await YoutubeTranscript.fetchTranscript(videoId);
  const text = transcript.map((segment) => segment.text).join(' ');
  return text;
}
