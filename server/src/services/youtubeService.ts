import axios from 'axios';

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

  // Fetch the YouTube page to extract caption track URL
  const pageRes = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    },
  });

  const html = pageRes.data as string;

  // Extract captions JSON from the page
  const captionsMatch = html.match(/"captions":\s*(\{.*?"playerCaptionsTracklistRenderer".*?\})\s*,\s*"videoDetails"/s);
  if (!captionsMatch) {
    throw new Error('No se encontraron subtítulos para este video. Asegúrate de que el video tenga subtítulos disponibles.');
  }

  let captionsJson;
  try {
    captionsJson = JSON.parse(captionsMatch[1]);
  } catch {
    throw new Error('Error al procesar los subtítulos del video');
  }

  const tracks = captionsJson?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks || tracks.length === 0) {
    throw new Error('Este video no tiene subtítulos disponibles');
  }

  // Prefer Spanish, then English, then first available
  const track =
    tracks.find((t: { languageCode: string }) => t.languageCode === 'es') ||
    tracks.find((t: { languageCode: string }) => t.languageCode === 'en') ||
    tracks[0];

  // Fetch the actual transcript XML
  const captionRes = await axios.get(track.baseUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  const xml = captionRes.data as string;

  // Parse XML to extract text segments
  const textSegments = xml.match(/<text[^>]*>(.*?)<\/text>/gs);
  if (!textSegments) {
    throw new Error('No se pudo extraer el texto de los subtítulos');
  }

  const text = textSegments
    .map((segment) => {
      const content = segment.replace(/<[^>]+>/g, '');
      return content
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, ' ')
        .trim();
    })
    .filter(Boolean)
    .join(' ');

  return text;
}
