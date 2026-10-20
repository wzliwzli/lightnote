import { writeFile } from 'node:fs/promises'

const [, , outPath, rawExpr = '', interaction = ''] = process.argv
const expr = rawExpr.startsWith('b64:')
  ? Buffer.from(rawExpr.slice(4), 'base64').toString('utf8')
  : rawExpr

const CDP_PORT = process.env.CDP_PORT || '9222'

const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
const target = list.find(
  (t) =>
    t.type === 'page' &&
    /lightnote\.local|127\.0\.0\.1:5179|index\.html/.test(t.url),
)
if (!target) {
  console.error('找不到页面目标:', JSON.stringify(list.map((t) => [t.type, t.url])))
  process.exit(1)
}

const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((res, rej) => {
  ws.onopen = res
  ws.onerror = rej
})

let seq = 0
const pending = new Map()
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
}
const send = (method, params = {}) =>
  new Promise((res) => {
    const id = ++seq
    pending.set(id, res)
    ws.send(JSON.stringify({ id, method, params }))
  })

const wait = (ms) => new Promise((res) => setTimeout(res, ms))

const centerOf = async (selector) => {
  const r = await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return JSON.stringify({ x: b.left + b.width / 2, y: b.top + b.height / 2 });
    })()`,
    returnByValue: true,
  })
  const raw = r.result?.result?.value
  return raw ? JSON.parse(raw) : null
}

await send('Runtime.enable')

if (expr) {
  const r = await send('Runtime.evaluate', {
    expression: expr,
    awaitPromise: true,
    returnByValue: true,
  })
  if (r.result?.exceptionDetails) {
    console.error(
      'eval error:',
      JSON.stringify(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails),
    )
  } else if (r.result?.result?.value !== undefined) {
    console.log('eval:', JSON.stringify(r.result.result.value))
  }
  await wait(1600)
}

// hover:SELECTOR   —— 把鼠标移到元素中心（触发 :hover）
// drag:SELECTOR:DY —— 按住元素中心往下拖 DY 像素（测试拖拽排序）
if (interaction.startsWith('hover:')) {
  const pos = await centerOf(interaction.slice(6))
  if (pos) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pos.x, y: pos.y, buttons: 0 })
    await wait(500)
  }
} else if (interaction.startsWith('drag:')) {
  const [, selector, dyRaw] = interaction.split(':')
  const dy = Number(dyRaw)
  const pos = await centerOf(selector)
  if (pos) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pos.x, y: pos.y, buttons: 0 })
    await wait(120)
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: pos.x,
      y: pos.y,
      button: 'left',
      buttons: 1,
      clickCount: 1,
    })
    const steps = 14
    for (let i = 1; i <= steps; i += 1) {
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: pos.x,
        y: pos.y + (dy * i) / steps,
        button: 'left',
        buttons: 1,
      })
      await wait(28)
    }
    await wait(120)
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: pos.x,
      y: pos.y + dy,
      button: 'left',
      buttons: 0,
      clickCount: 1,
    })
    await wait(700)
  }
}

const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true })
if (!shot.result?.data) {
  console.error('截图失败:', JSON.stringify(shot).slice(0, 400))
  process.exit(1)
}
await writeFile(outPath, Buffer.from(shot.result.data, 'base64'))
console.log('saved', outPath)
ws.close()
