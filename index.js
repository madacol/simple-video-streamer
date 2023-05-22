const http = require('http');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const videoDir = process.argv[2] || process.cwd();
const videoFiles = fs.readdirSync(videoDir);

// The HTML website
const webpage = String.raw`
<!DOCTYPE html>
<html>
<head>
  <title>Video Streamer</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    h1 {
      margin-bottom: 10px;
    }
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      margin-bottom: 10px;
    }
    video {
      width: 100%;
      max-width: 600px;
    }
  </style>
</head>
<body>
  <h1>Video Streamer</h1>
  <ul>
    ${videoFiles.map(file => `<li><a href="/stream?file=${file}">${file}</a></li>`).join('')}
  </ul>
  <video id="videoPlayer" controls></video>
  <script>
    const videoPlayer = document.getElementById('videoPlayer');

    const videoLinks = document.querySelectorAll('ul li a');
    videoLinks.forEach(videoLink => {
      videoLink.addEventListener('click', event => {
        event.preventDefault();
        const videoURL = videoLink.getAttribute('href');
        videoPlayer.src = videoURL;
        videoPlayer.scrollIntoView();
        videoPlayer.focus();
        videoPlayer.play();
      });
    });
  </script>
</body>
</html>
`;

http.createServer((req, res) => {
  if (req.url.startsWith('/stream')) {
    const file = req.url.split('=')[1];
    const filePath = path.join(videoDir, decodeURIComponent(file));
    const fileName = path.basename(filePath);

    // Convert the video file to MP4 using ffmpeg and stream it
    const command = ffmpeg(fs.createReadStream(decodeURIComponent(filePath)))
      .inputFormat('matroska')
      .outputOptions('-c:v', 'libx264') // Docs for this codec: https://trac.ffmpeg.org/wiki/Encode/VP9
      .outputOptions('-c:a', 'aac')
      // Next option improves seeking in the video and fast starts when streaming,
      .outputOptions('-movflags', 'frag_keyframe+empty_moov')


      /** 
        These are Options if using VP9 codec instead of h264,
        which was compatible with a smart TV's browser I was testing, but was slower to encode,
        it got way below 1x speed for realtime encoding, so I could not use it for streaming
      
        .outputOptions('-c:v', 'libvpx-vp9') // Docs for this codec: https://trac.ffmpeg.org/wiki/Encode/VP9
        .outputOptions('-c:a', 'libopus')
        // "Note that -b:v MUST be 0 for **constant quality mode**" https://trac.ffmpeg.org/wiki/Encode/VP9#constantq
        .outputOptions('-b:v', '0') 
        .outputOptions('-crf', '30') // increase for lower quality, decrease for higher quality
        // Next 2 options are for controlling speed and quality
        .outputOptions('-deadline', 'realtime')
        .outputOptions('-speed', '3')
        // .outputOptions('-pix_fmt', 'yuv420p')

       */
      
      // .outputOptions('-scodec', 'mov_text')
      // .outputOptions('-preset', 'ultrafast')
      // .outputOptions('-tile-columns', '6')
      // .outputOptions('-threads', '8')
      // .outputOptions('-metadata:s:s:0', 'language=eng')
      .format('mp4')
      .on('start', commandLine => {
        console.log('ffmpeg command:', commandLine, '\nfile:', filePath);
        res.writeHead(200, {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `inline; filename="${fileName}.mp4"`
        });
        // Handle stream closure
        res.on('close', (asd) => {
          // Destroy the ffmpeg process to free up resources
          command.kill('SIGKILL');
      });
      })
      .on('error', (err, stdout, stderr) => {
        console.error('ffmpeg error:', err.message, '\nstdout:', stdout, '\nstderr:', stderr);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      });

    // Stream the MP4 conversion
    command.pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(webpage);
  }
}).listen(3000, () => {
  console.log(`Web server running at http://localhost:3000/`);
  console.log(`Serving videos from ${videoDir}/`);
});
