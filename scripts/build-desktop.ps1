# 一键打包桌面版：网页 -> 单文件 HTML -> WebView2 桌面壳 -> Lightnote.exe
# 需要：Node（项目已装依赖）、.NET Framework 自带的 csc.exe、能访问 nuget.org
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$root = Split-Path -Parent $PSScriptRoot
$desktop = Join-Path $root 'desktop'
$src = Join-Path $desktop 'src'
$out = Join-Path $desktop 'build'
$cache = Join-Path $desktop '.cache'

$nodeExe = $env:LIGHTNOTE_NODE
if (-not $nodeExe) {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if ($cmd) { $nodeExe = $cmd.Source }
}
if (-not $nodeExe -or -not (Test-Path $nodeExe)) {
  throw '找不到 node。装好 Node.js 后重试，或用环境变量 LIGHTNOTE_NODE 指向 node.exe'
}

$csc = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path $csc)) { throw "找不到 csc.exe：$csc" }

Write-Host '[1/5] 构建网页（tsc + vite）'
Push-Location $root
try {
  & $nodeExe 'node_modules\typescript\bin\tsc' --noEmit
  if ($LASTEXITCODE -ne 0) { throw 'tsc 类型检查失败' }
  & $nodeExe 'node_modules\vite\bin\vite.js' build
  if ($LASTEXITCODE -ne 0) { throw 'vite build 失败' }
} finally {
  Pop-Location
}

Write-Host '[2/5] 准备 WebView2 SDK'
$pkgDir = Join-Path $cache 'webview2'
$libDir = Join-Path $pkgDir 'lib\net462'
if (-not (Test-Path $libDir)) { $libDir = Join-Path $pkgDir 'lib\net45' }
$coreDll = Join-Path $libDir 'Microsoft.Web.WebView2.Core.dll'
if (-not (Test-Path $coreDll)) {
  New-Item -ItemType Directory -Force -Path $cache | Out-Null
  $index = Invoke-RestMethod 'https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/index.json'
  $versions = @($index.versions) | Where-Object { $_ -notmatch '-' }
  $ver = $versions[$versions.Count - 1]
  Write-Host "      下载 Microsoft.Web.WebView2 $ver"
  $zip = Join-Path $cache 'webview2.zip'
  Invoke-WebRequest "https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/$ver/microsoft.web.webview2.$ver.nupkg" -OutFile $zip -UseBasicParsing
  if (Test-Path $pkgDir) { Remove-Item $pkgDir -Recurse -Force }
  Expand-Archive -LiteralPath $zip -DestinationPath $pkgDir -Force
  $libDir = Join-Path $pkgDir 'lib\net462'
  if (-not (Test-Path $libDir)) { $libDir = Join-Path $pkgDir 'lib\net45' }
  $coreDll = Join-Path $libDir 'Microsoft.Web.WebView2.Core.dll'
}

Write-Host '[3/5] 准备输出目录'
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force -Path (Join-Path $out 'web') | Out-Null
Copy-Item (Join-Path $root 'dist\index.html') (Join-Path $out 'web\index.html') -Force

Write-Host '[4/5] 复制 WebView2 运行时'
Copy-Item (Join-Path $libDir 'Microsoft.Web.WebView2.Core.dll') $out -Force
Copy-Item (Join-Path $libDir 'Microsoft.Web.WebView2.WinForms.dll') $out -Force
$loader = Join-Path $pkgDir 'runtimes\win-x64\native\WebView2Loader.dll'
if (Test-Path $loader) {
  Copy-Item $loader $out -Force
} else {
  Write-Warning '没找到 WebView2Loader.dll，exe 可能无法启动'
}

Write-Host '[5/5] 编译桌面壳'
$cscArgs = @(
  '/nologo', '/target:winexe', '/platform:x64', '/optimize+', '/codepage:65001',
  "/win32icon:$src\app.ico",
  "/resource:$src\app.ico,app.ico",
  "/out:$out\Lightnote.exe",
  '/reference:System.dll',
  '/reference:System.Core.dll',
  '/reference:System.Drawing.dll',
  '/reference:System.Windows.Forms.dll',
  "/reference:$out\Microsoft.Web.WebView2.Core.dll",
  "/reference:$out\Microsoft.Web.WebView2.WinForms.dll",
  "$src\Lightnote.cs"
)
& $csc @cscArgs
if ($LASTEXITCODE -ne 0 -or -not (Test-Path (Join-Path $out 'Lightnote.exe'))) { throw 'csc 编译失败' }

$exe = Get-Item (Join-Path $out 'Lightnote.exe')
$total = (Get-ChildItem $out -Recurse -File | Measure-Object -Property Length -Sum).Sum
Write-Host ''
Write-Host "完成：$($exe.FullName)"
Write-Host ("exe {0:N0} KB / 整个文件夹 {1:N0} KB" -f ($exe.Length / 1KB), ($total / 1KB))
