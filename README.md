# Simple video streamer

This is a nodejs cli command that receives a directory of videos and fires up an http server that stream the videos (and reencodes them on-the-fly) to its web client.

It uses [fluent-ffmpeg](https://www.npmjs.com/package/fluent-ffmpeg) to reencode on-the-fly the videos to h264/aac mp4 format.

All code is contained in the single file `index.js` and it was mostly made with chatGPT, [see chat log](chatGPT.md)

## Installation

clone and `cd` into the repo, then:

```bash
sudo apt-get install -y ffmpeg
npm install fluent-ffmpeg
```

## Usage

```bash
npm start <path-to-videos>
# or just
node index.js <path-to-videos>
```

There's also included a bash script `stream.sh` that you can symlink it somewhere in your path (e.g. `~/.local/bin`)

```bash
chmod +x stream.sh
stream.sh <path-to-videos>
```

Now open the browser at http://localhost:3000
