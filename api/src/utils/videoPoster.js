// src/utils/videoPoster.js
// Extracts a still frame from an uploaded video to use as its thumbnail
// (mt_video.poster). Posters land next to the video in uploads/memorial/videos/
// and are served by the existing static route via mediaUrl('videos', poster).
//
// Requires:  npm install ffmpeg-static   (in api/)
// ffmpeg-static ships a platform-specific binary, so no system ffmpeg needed.
//
// Everything here FAILS SOFT: any problem returns null, the poster column stays
// NULL, and the UI falls back to the video/music glyph. A thumbnail is never
// worth failing an upload over.

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

// Resolved lazily so a missing dependency degrades instead of crashing boot.
let ffmpegPath = null;
try {
  ffmpegPath = require('ffmpeg-static');
} catch (_) {
  console.warn('[videoPoster] ffmpeg-static not installed - video posters disabled.');
}

const hasFfmpeg = () => Boolean(ffmpegPath);

// "1783998414163-clip.mp4" -> "1783998414163-clip-poster.jpg"
// mt_video.poster is varchar(255); multer filenames can already be long, so the base is clipped to leave room for the suffix.
function posterNameFor(filename) {
  const base = String(filename).replace(/\.[^.]+$/, '');
  return `${base.slice(0, 230)}-poster.jpg`;
}

function runFfmpeg(args, timeoutMs) {
  return new Promise((resolve) => {
    execFile(ffmpegPath, args, { timeout: timeoutMs }, (err) => resolve(!err));
  });
}

/**
 * Generate a poster for a video file.
 * @param {string} videoPath absolute path to the video on disk (multer's file.path)
 * @returns {Promise<string|null>} the poster FILENAME to store in mt_video.poster, or null
 */
async function generatePoster(videoPath) {
  if (!ffmpegPath) return null;
  if (!videoPath || !fs.existsSync(videoPath)) return null;

  const dir = path.dirname(videoPath);
  const outName = posterNameFor(path.basename(videoPath));
  const output = path.join(dir, outName);

  const args = (seek) => [
    '-y', 
    '-ss',
    String(seek),
    '-i',
    videoPath,
    '-frames:v',
    '1',
    '-vf',
    'scale=640:-2', 
    '-q:v',
    '4',
    output,
  ];

  // Seek 1s in to skip black lead-in frames; clips shorter than that yield nothing, so fall back to the very first frame.
  for (const seek of [1, 0]) {
    const ok = await runFfmpeg(args(seek), 30000);
    if (ok && fs.existsSync(output) && fs.statSync(output).size > 0) return outName;
  }

  // Clean up a zero-byte artifact if ffmpeg left one behind.
  try {
    if (fs.existsSync(output)) fs.unlinkSync(output);
  } catch (_) {
    /* ignore */
  }
  console.warn('[videoPoster] could not extract a frame from', path.basename(videoPath));
  return null;
}

module.exports = { generatePoster, posterNameFor, hasFfmpeg };