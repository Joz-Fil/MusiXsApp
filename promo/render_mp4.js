const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 4321;
const ffmpegPath = path.resolve(__dirname, '../node_modules/ffmpeg-static/ffmpeg.exe');
const ttsAudioPath = path.resolve(__dirname, '../assets/tts-audio.mp3');
const rawWebmPath = path.resolve(__dirname, 'raw_recording.webm');
const outputMp4Path = path.resolve(__dirname, 'MusiXs_Promo_Video.mp4');
const htmlPath = path.resolve(__dirname, 'auto_render.html');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

console.log('--- MusiXs MP4 Video Generator ---');
console.log('FFmpeg:', ffmpegPath);
console.log('HTML Target:', htmlPath);

let edgeProcess = null;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/auto_render.html')) {
    const content = fs.readFileSync(htmlPath);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
    return;
  }

  if (req.method === 'GET' && req.url === '/icon_base64.txt') {
    const b64Path = path.resolve(__dirname, 'icon_base64.txt');
    if (fs.existsSync(b64Path)) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(fs.readFileSync(b64Path, 'utf8'));
      return;
    }
  }

  if (req.method === 'POST' && req.url === '/upload-promo') {
    console.log('Receiving promo video stream from browser...');
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      console.log(`Saved raw video recording (${(buffer.length / 1024 / 1024).toFixed(2)} MB).`);
      fs.writeFileSync(rawWebmPath, buffer);

      res.writeHead(200);
      res.end('OK');

      if (edgeProcess) {
        try {
          edgeProcess.kill();
        } catch (e) {}
      }

      console.log('Encoding to Master H.264 MP4 with FFmpeg...');
      encodeToMp4();
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

function encodeToMp4() {
  const hasTTS = fs.existsSync(ttsAudioPath);
  let args = [];

  if (hasTTS) {
    console.log('Mixing voiceover audio track (assets/tts-audio.mp3) at 7.5s...');
    args = [
      '-y',
      '-i', rawWebmPath,
      '-i', ttsAudioPath,
      '-filter_complex',
      '[1:a]adelay=7500|7500[delayed_vo];[0:a][delayed_vo]amix=inputs=2:duration=first:dropout_transition=2[aout]',
      '-map', '0:v',
      '-map', '[aout]',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '19',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      outputMp4Path
    ];
  } else {
    args = [
      '-y',
      '-i', rawWebmPath,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '19',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      outputMp4Path
    ];
  }

  const p = spawn(ffmpegPath, args);

  p.stderr.on('data', data => {
    // console.log(data.toString());
  });

  p.on('close', code => {
    if (code === 0 && fs.existsSync(outputMp4Path)) {
      const stats = fs.statSync(outputMp4Path);
      console.log('====================================================');
      console.log('🎉 PROMOTIONAL MP4 VIDEO GENERATED SUCCESSFULLY!');
      console.log(`File: ${outputMp4Path}`);
      console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log('====================================================');
      process.exit(0);
    } else {
      console.error('FFmpeg encoding failed with code', code);
      process.exit(1);
    }
  });
}

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log('Launching Headless Edge to render and record 36-second promo video...');

  edgeProcess = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=1280,720',
    `http://localhost:${PORT}/auto_render.html`
  ]);

  edgeProcess.on('error', err => {
    console.error('Failed to launch Edge:', err);
    process.exit(1);
  });
});
