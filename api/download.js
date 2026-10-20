import ytdl from '@distube/ytdl-core';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: 'YouTube Link is required' });
  }

  try {
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube link format' });
    }

    // Video stream extraction without 3rd-party APIs
    const info = await ytdl.getInfo(url);

    // Audio & Video combine formats
    const formats = info.formats
      .filter((f) => f.hasAudio && f.hasVideo && f.container === 'mp4')
      .map((f) => ({
        quality: f.qualityLabel || '720p',
        url: f.url
      }));

    // Best Audio Format
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });

    const bestVideo = formats[0] || info.formats.find(f => f.hasVideo && f.url);

    return res.status(200).json({
      status: 'success',
      title: info.videoDetails.title,
      duration: `${Math.floor(info.videoDetails.lengthSeconds / 60)}m ${info.videoDetails.lengthSeconds % 60}s`,
      thumbnail: info.videoDetails.thumbnails.pop()?.url,
      videoUrl: bestVideo ? bestVideo.url : null,
      audioUrl: audioFormat ? audioFormat.url : null
    });

  } catch (error) {
    console.error('YTDL Error:', error);
    return res.status(500).json({
      error: 'YouTube security check hit. Please retry another video.'
    });
  }
}
