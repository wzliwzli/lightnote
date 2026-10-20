/** 与桌面壳（WebView2 宿主）通信的小桥。浏览器里调用全部是安全的空操作。 */

export type ShellMode = 'none' | 'float' | 'full'

export type ShellMessage = 'ready' | 'drag' | 'minimize' | 'maximize' | 'close' | 'expand' | 'compact'

interface WebViewBridge {
  postMessage: (message: unknown) => void
  addEventListener: (type: 'message', handler: (event: MessageEvent) => void) => void
  removeEventListener: (type: 'message', handler: (event: MessageEvent) => void) => void
}

function bridge(): WebViewBridge | null {
  const host = window as unknown as { chrome?: { webview?: WebViewBridge } }
  return host.chrome?.webview ?? null
}

export function isDesktopShell(): boolean {
  return bridge() !== null
}

export function postToShell(message: ShellMessage | string): void {
  bridge()?.postMessage(message)
}

export function subscribeShell(handler: (mode: 'float' | 'full') => void): () => void {
  const b = bridge()
  if (!b) return () => undefined
  const onMessage = (event: MessageEvent) => {
    const value = typeof event.data === 'string' ? event.data : ''
    if (value === 'float' || value === 'full') handler(value)
  }
  b.addEventListener('message', onMessage)
  return () => b.removeEventListener('message', onMessage)
}

/** 首帧就按宿主给的模式渲染，避免先闪一下完整界面 */
export const initialShellMode: ShellMode = (() => {
  if (!bridge()) return 'none'
  const mode = new URLSearchParams(window.location.search).get('mode')
  return mode === 'float' ? 'float' : 'full'
})()
