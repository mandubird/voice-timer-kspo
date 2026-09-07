/**
 * 음성 파일 관리 로컬 서버
 * 실행: node audio-server.cjs
 * 포트: 3456
 */
const http = require('http')
const { execFile } = require('child_process')
const fs = require('fs')
const path = require('path')

const PORT = 3456
const ROOT = __dirname
const AUDIO_DIR = path.join(ROOT, 'public', 'audio')

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch { resolve({}) }
    })
  })
}

const server = http.createServer(async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // POST /delete-and-generate
  // { files: ['common_start_01', ...], voices: ['default'] }
  // voices 기본값: ['default']  — energy는 UI에서 명시적으로 체크해야만 포함
  if (req.method === 'POST' && req.url === '/delete-and-generate') {
    const { files = [], voices = ['default'] } = await readBody(req)

    // SSE로 로그 스트리밍
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    const send = (msg) => res.write(`data: ${JSON.stringify({ msg })}\n\n`)

    if (files.length === 0) {
      send('❌ 파일이 선택되지 않았습니다.')
      send('__DONE__')
      res.end()
      return
    }

    // 1. 선택된 파일만 삭제 (지정 voice 폴더에서만)
    send(`🗑️  ${files.length}개 × ${voices.length}팩 삭제 중...`)
    let deleted = 0
    for (const name of files) {
      for (const voice of voices) {
        const p = path.join(AUDIO_DIR, voice, `${name}.wav`)
        if (fs.existsSync(p)) { fs.unlinkSync(p); deleted++ }
      }
    }
    send(`✅ ${deleted}개 파일 삭제 완료`)

    // 2. select 모드로 지정 파일만 생성 → API 호출 = 선택수 × voice수
    const fileList = files.join(',')
    send(`\n📋 선택 파일 ${files.length}개 × ${voices.length}팩 — API 호출 예상 ${files.length * voices.length}회`)

    for (const voice of voices) {
      send(`\n🎙️  [${voice}] ${files.length}개 생성 중...`)
      await new Promise((resolve) => {
        const child = execFile(
          'node',
          ['generate_audio.cjs', voice, 'select', fileList],
          { cwd: ROOT },
        )
        child.stdout.on('data', d => d.trim().split('\n').forEach(l => send(l)))
        child.stderr.on('data', d => d.trim().split('\n').forEach(l => send(`⚠️ ${l}`)))
        child.on('close', (code) => {
          send(code === 0 ? `✅ [${voice}] 완료` : `❌ [${voice}] 오류 (code ${code})`)
          resolve()
        })
      })
    }

    send('__DONE__')
    res.end()
    return
  }

  // 정적 파일 서빙 (audio-preview.html + public/audio/*)
  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.wav':  'audio/wav',
    '.mp3':  'audio/mpeg',
    '.js':   'text/javascript',
    '.css':  'text/css',
    '.png':  'image/png',
  }
  let filePath
  if (req.url === '/' || req.url === '/audio-preview.html') {
    filePath = path.join(ROOT, 'public', 'audio-preview.html')
  } else {
    // /audio/default/xxx.wav 등
    filePath = path.join(ROOT, 'public', req.url.split('?')[0])
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase()
    const mime = MIME[ext] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': mime })
    fs.createReadStream(filePath).pipe(res)
  } else {
    res.writeHead(404); res.end()
  }
})

server.listen(PORT, () => {
  console.log(`✅ 음성 관리 서버 실행 중: http://localhost:${PORT}`)
  console.log(`   👉 미리듣기: http://localhost:${PORT}/audio-preview.html`)
})
