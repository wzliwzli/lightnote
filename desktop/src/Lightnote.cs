// 轻笺 Lightnote —— 桌面壳（无边框悬浮窗 + 托盘常驻）
// 用 .NET Framework 自带的 csc.exe 编译，不需要 SDK / Rust / Visual Studio。
using System;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace Lightnote
{
    internal static class Program
    {
        internal const string AppTitle = "轻笺";
        internal const string VirtualHost = "lightnote.local";

        [DllImport("user32.dll")]
        private static extern bool SetProcessDPIAware();

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool SetProcessDpiAwarenessContext(IntPtr value);

        [STAThread]
        private static void Main(string[] args)
        {
            try { SetProcessDpiAwarenessContext(new IntPtr(-4)); }
            catch { SetProcessDPIAware(); }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string webDir = Path.Combine(baseDir, "web");
            string entry = Path.Combine(webDir, "index.html");

            if (!File.Exists(entry))
            {
                MessageBox.Show(
                    "找不到 web\\index.html。\n\n请把 web 文件夹放在 exe 旁边：\n" + webDir,
                    AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            string appData = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Lightnote");
            try { Directory.CreateDirectory(appData); } catch { }
            Environment.SetEnvironmentVariable("WEBVIEW2_USER_DATA_FOLDER", Path.Combine(appData, "WebView"));

            bool selfTest = Array.IndexOf(args, "--selftest") >= 0;

            Application.Run(new MainForm(webDir, appData, selfTest));
        }
    }

    internal sealed class MainForm : Form
    {
        private const int WM_NCLBUTTONDOWN = 0xA1;
        private const int HTCAPTION = 0x2;

        [DllImport("user32.dll")]
        private static extern bool ReleaseCapture();

        [DllImport("user32.dll")]
        private static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);

        private const int WM_NCCALCSIZE = 0x0083;
        private const int WM_NCHITTEST = 0x0084;
        private const int HTCLIENT = 1;

        // Win11 的窗口圆角
        private const int DWMWA_WINDOW_CORNER_PREFERENCE = 33;
        private const int DWMWCP_ROUND = 2;

        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int value, int size);

        /// <summary>优先用内嵌图标，避免 ExtractAssociatedIcon 拿到低分辨率或失败时退回系统默认图标</summary>
        private static Icon LoadAppIcon()
        {
            try
            {
                using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("app.ico"))
                {
                    if (stream != null) return new Icon(stream, new Size(32, 32));
                }
            }
            catch { }

            try { return Icon.ExtractAssociatedIcon(Application.ExecutablePath); }
            catch { }

            return SystemIcons.Application;
        }

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);

            // 句柄建好后才能拿到真实的 DPI（构造函数里拿到的可能还是 96）
            try { _scale = Math.Max(1f, DeviceDpi / 96f); }
            catch { }

            MinimumSize = _float
                ? new Size((int)(300 * _scale), (int)(380 * _scale))
                : new Size((int)(700 * _scale), (int)(500 * _scale));

            try
            {
                int round = DWMWCP_ROUND;
                DwmSetWindowAttribute(Handle, DWMWA_WINDOW_CORNER_PREFERENCE, ref round, sizeof(int));
            }
            catch { }
        }

        protected override void WndProc(ref Message m)
        {
            // 去掉非客户区：视觉上无边框，但保留 DWM 的阴影和圆角
            if (m.Msg == WM_NCCALCSIZE && m.WParam != IntPtr.Zero)
            {
                m.Result = IntPtr.Zero;
                return;
            }

            // 悬浮窗可以用鼠标拖边缘改大小；完整窗口默认就是可缩放的
            if (m.Msg == WM_NCHITTEST)
            {
                base.WndProc(ref m);
                if (!_float) return;

                m.Result = (IntPtr)HTCLIENT;

                int rawX = m.LParam.ToInt32();
                int sx = (short)(rawX & 0xFFFF);
                int sy = (short)((rawX >> 16) & 0xFFFF);
                Point p = PointToClient(new Point(sx, sy));

                int grip = (int)(6 * _scale);
                bool left = p.X <= grip;
                bool right = p.X >= ClientSize.Width - grip;
                bool top = p.Y <= grip;
                bool bottom = p.Y >= ClientSize.Height - grip;

                if (top && left) { m.Result = (IntPtr)13; return; }     // HTTOPLEFT
                if (top && right) { m.Result = (IntPtr)14; return; }    // HTTOPRIGHT
                if (bottom && left) { m.Result = (IntPtr)16; return; }  // HTBOTTOMLEFT
                if (bottom && right) { m.Result = (IntPtr)17; return; } // HTBOTTOMRIGHT
                if (left) { m.Result = (IntPtr)10; return; }            // HTLEFT
                if (right) { m.Result = (IntPtr)11; return; }           // HTRIGHT
                if (top) { m.Result = (IntPtr)12; return; }             // HTTOP
                if (bottom) { m.Result = (IntPtr)15; return; }          // HTBOTTOM
                return;
            }

            base.WndProc(ref m);
        }

        private readonly string _webDir;
        private readonly string _appData;
        private readonly bool _selfTest;
        private readonly Timer _timeout;
        private readonly Timer _saveTimer;

        private WebView2 _web;
        private NotifyIcon _tray;
        private bool _finished;
        private bool _exiting;
        private bool _pageReady;
        private bool _float = true;
        private bool _alwaysOnTop = false;
        private double _opacity = 0.95;
        private float _scale = 1f;

        internal MainForm(string webDir, string appData, bool selfTest)
        {
            _webDir = webDir;
            _appData = appData;
            _selfTest = selfTest;

            Text = Program.AppTitle;
            BackColor = Color.FromArgb(244, 247, 246);
            // Sizable + WM_NCCALCSIZE 去掉边框：这样 DWM 才会给窗口画阴影和圆角
            FormBorderStyle = FormBorderStyle.Sizable;
            StartPosition = FormStartPosition.Manual;
            ShowInTaskbar = false;
            TopMost = false;
            DoubleBuffered = true;
            KeyPreview = true;

            try { Icon = LoadAppIcon(); }
            catch { }

            try
            {
                using (Graphics probe = CreateGraphics())
                {
                    _scale = Math.Max(1f, probe.DpiX / 96f);
                }
            }
            catch { }

            Size = FloatSize();

            _web = new WebView2();
            _web.Dock = DockStyle.Fill;
            try { _web.DefaultBackgroundColor = Color.FromArgb(244, 247, 246); }
            catch { }
            _web.CoreWebView2InitializationCompleted += OnInitialized;
            Controls.Add(_web);

            BuildTray();

            _timeout = new Timer();
            _timeout.Interval = 25000;
            _timeout.Tick += OnTimeout;

            _saveTimer = new Timer();
            _saveTimer.Interval = 500;
            _saveTimer.Tick += (s, e) => { _saveTimer.Stop(); SaveBounds(); };

            Move += (s, e) => { _saveTimer.Stop(); _saveTimer.Start(); };
            Resize += (s, e) => { _saveTimer.Stop(); _saveTimer.Start(); };
        }

        // ---------------- 尺寸 ----------------

        private Size FloatSize()
        {
            return new Size((int)(384 * _scale), (int)(568 * _scale));
        }

        private Size FullSize()
        {
            Rectangle area = Screen.PrimaryScreen.WorkingArea;
            return new Size(
                Math.Min((int)(1180 * _scale), (int)(area.Width * 0.92)),
                Math.Min((int)(820 * _scale), (int)(area.Height * 0.9)));
        }

        private Point FloatDefaultLocation(Size size)
        {
            Rectangle area = Screen.PrimaryScreen.WorkingArea;
            return new Point(
                area.Right - size.Width - (int)(24 * _scale),
                area.Bottom - size.Height - (int)(24 * _scale));
        }

        // ---------------- 托盘 ----------------

        private void BuildTray()
        {
            Icon icon = LoadAppIcon();

            var menu = new ContextMenuStrip();

            var floatItem = new ToolStripMenuItem("悬浮窗模式");
            floatItem.Click += (s, e) => ApplyMode(true);
            menu.Items.Add(floatItem);

            var fullItem = new ToolStripMenuItem("完整窗口");
            fullItem.Click += (s, e) => ApplyMode(false);
            menu.Items.Add(fullItem);

            menu.Items.Add(new ToolStripSeparator());

            var topItem = new ToolStripMenuItem("总在最前");
            topItem.CheckOnClick = true;
            topItem.Checked = _alwaysOnTop;
            topItem.CheckedChanged += (s, e) =>
            {
                _alwaysOnTop = topItem.Checked;
                if (_float) TopMost = _alwaysOnTop;
            };
            menu.Items.Add(topItem);

            menu.Items.Add(new ToolStripSeparator());

            var quitItem = new ToolStripMenuItem("退出轻笺");
            quitItem.Click += (s, e) => ExitApp();
            menu.Items.Add(quitItem);

            _tray = new NotifyIcon();
            _tray.Icon = icon;
            _tray.Text = Program.AppTitle;
            _tray.ContextMenuStrip = menu;
            _tray.Visible = true;
            _tray.DoubleClick += (s, e) =>
            {
                if (!Visible) Show();
                ApplyMode(_float);
                Activate();
            };
        }

        // ---------------- 启动 ----------------

        protected override void OnShown(EventArgs e)
        {
            base.OnShown(e);

            Rectangle saved = LoadFloatBounds();
            if (saved.IsEmpty)
            {
                Size = FloatSize();
                Location = FloatDefaultLocation(Size);
            }
            else
            {
                Bounds = saved;
            }

            try { _web.EnsureCoreWebView2Async(null); }
            catch (Exception ex) { Fail("WebView2 初始化失败：" + ex.Message); return; }

            // 句柄已存在，这时设透明度才会真的生效
            ApplyWindowOpacity();

            _timeout.Start();
        }

        private void OnInitialized(object sender, CoreWebView2InitializationCompletedEventArgs e)
        {
            if (!e.IsSuccess)
            {
                string message = e.InitializationException != null
                    ? e.InitializationException.Message
                    : "未知错误";
                Fail("WebView2 初始化失败：" + message);
                return;
            }

            CoreWebView2 core = _web.CoreWebView2;
            try
            {
                core.Settings.IsStatusBarEnabled = false;
                core.Settings.AreDevToolsEnabled = true;
                core.Settings.IsZoomControlEnabled = false;
                core.SetVirtualHostNameToFolderMapping(
                    Program.VirtualHost, _webDir, CoreWebView2HostResourceAccessKind.Allow);
            }
            catch (Exception ex)
            {
                Fail("加载本地页面失败：" + ex.Message);
                return;
            }

            core.WebMessageReceived += OnWebMessage;
            core.NavigationCompleted += OnNavigationCompleted;
            core.NewWindowRequested += OnNewWindowRequested;
            core.NavigationStarting += OnNavigationStarting;
            core.Navigate("https://" + Program.VirtualHost + "/index.html?mode=float");
        }

        private void OnWebMessage(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            string message;
            try { message = e.TryGetWebMessageAsString(); }
            catch { return; }

            if (message == "ready")
            {
                _pageReady = true;
                SendMode();
                return;
            }

            if (message.StartsWith("resize:", StringComparison.Ordinal))
            {
                StartResize(message.Substring(7));
                return;
            }

            if (message.StartsWith("opacity:", StringComparison.Ordinal))
            {
                double value;
                if (double.TryParse(
                    message.Substring(8),
                    NumberStyles.Float,
                    CultureInfo.InvariantCulture,
                    out value))
                {
                    ApplyOpacity(value);
                }
                return;
            }

            if (message == "drag") { StartDrag(); return; }
            if (message == "minimize") { WindowState = FormWindowState.Minimized; return; }
            if (message == "maximize")
            {
                WindowState = WindowState == FormWindowState.Maximized
                    ? FormWindowState.Normal
                    : FormWindowState.Maximized;
                return;
            }
            if (message == "close") { Hide(); return; }
            if (message == "expand") { ApplyMode(false); return; }
            if (message == "compact") { ApplyMode(true); return; }
        }

        private void StartDrag()
        {
            if (_selfTest) return;
            ReleaseCapture();
            SendMessage(Handle, WM_NCLBUTTONDOWN, (IntPtr)HTCAPTION, IntPtr.Zero);
        }

        /// <summary>WebView2 子窗口吃掉了 WM_NCHITTEST，所以由页面发指令，这里进入系统缩放循环</summary>
        private void StartResize(string direction)
        {
            if (_selfTest) return;

            int hit;
            switch (direction)
            {
                case "left": hit = 10; break;          // HTLEFT
                case "right": hit = 11; break;         // HTRIGHT
                case "top": hit = 12; break;           // HTTOP
                case "topleft": hit = 13; break;       // HTTOPLEFT
                case "topright": hit = 14; break;      // HTTOPRIGHT
                case "bottom": hit = 15; break;        // HTBOTTOM
                case "bottomleft": hit = 16; break;    // HTBOTTOMLEFT
                case "bottomright": hit = 17; break;   // HTBOTTOMRIGHT
                default: return;
            }

            ReleaseCapture();
            SendMessage(Handle, WM_NCLBUTTONDOWN, (IntPtr)hit, IntPtr.Zero);
        }

        /// <summary>窗口级透明度（分层窗口），页面自己画不出桌面透光。
        /// 只作用于悬浮窗，完整窗口始终不透明。</summary>
        private void ApplyOpacity(double value)
        {
            if (value < 0.4) value = 0.4;
            if (value > 1.0) value = 1.0;
            _opacity = value;
            ApplyWindowOpacity();
        }

        private void ApplyWindowOpacity()
        {
            try { Opacity = _float ? _opacity : 1.0; }
            catch { }
        }

        private void SendMode()
        {
            if (!_pageReady || _web == null || _web.CoreWebView2 == null) return;
            _web.CoreWebView2.PostWebMessageAsJson(_float ? "\"float\"" : "\"full\"");
        }

        // ---------------- 模式切换 ----------------

        private void ApplyMode(bool floating)
        {
            bool changed = _float != floating;
            _float = floating;

            if (floating)
            {
                ShowInTaskbar = false;
                WindowState = FormWindowState.Normal;
                MinimumSize = new Size((int)(300 * _scale), (int)(380 * _scale));
                Rectangle saved = LoadFloatBounds();
                if (saved.IsEmpty)
                {
                    Size = FloatSize();
                    Location = FloatDefaultLocation(Size);
                }
                else
                {
                    Size = saved.Size;
                    Location = saved.Location;
                }
                TopMost = _alwaysOnTop;
            }
            else
            {
                Rectangle saved = LoadFullBounds();
                ShowInTaskbar = true;
                WindowState = FormWindowState.Normal;
                TopMost = false;
                MinimumSize = new Size((int)(700 * _scale), (int)(500 * _scale));
                Size = saved.IsEmpty ? FullSize() : saved.Size;
                Location = saved.IsEmpty
                    ? new Point(
                        (Screen.PrimaryScreen.WorkingArea.Width - Width) / 2 + Screen.PrimaryScreen.WorkingArea.Left,
                        (Screen.PrimaryScreen.WorkingArea.Height - Height) / 2 + Screen.PrimaryScreen.WorkingArea.Top)
                    : saved.Location;
            }

            if (!Visible) Show();
            Activate();
            ApplyWindowOpacity();
            if (changed) SendMode();
        }

        // ---------------- 持久化 ----------------

        private string FloatPath { get { return Path.Combine(_appData, "float-pos.txt"); } }
        private string FullPath { get { return Path.Combine(_appData, "full-bounds.txt"); } }

        private Rectangle LoadFloatBounds()
        {
            try
            {
                if (!File.Exists(FloatPath)) return Rectangle.Empty;
                string[] parts = File.ReadAllText(FloatPath).Split(',');
                Size fallback = FloatSize();

                int x;
                int y;
                int w;
                int h;

                if (parts.Length == 2)
                {
                    // 老版本只记了位置
                    if (!int.TryParse(parts[0], out x) || !int.TryParse(parts[1], out y)) return Rectangle.Empty;
                    w = fallback.Width;
                    h = fallback.Height;
                }
                else if (parts.Length == 4)
                {
                    if (!int.TryParse(parts[0], out x) || !int.TryParse(parts[1], out y)) return Rectangle.Empty;
                    if (!int.TryParse(parts[2], out w) || !int.TryParse(parts[3], out h)) return Rectangle.Empty;
                }
                else
                {
                    return Rectangle.Empty;
                }

                w = Math.Max((int)(300 * _scale), w);
                h = Math.Max((int)(380 * _scale), h);

                Rectangle area = Screen.FromPoint(new Point(x + 40, y + 40)).WorkingArea;
                if (x < area.Left - w + 80 || y < area.Top - 20 || x > area.Right - 60 || y > area.Bottom - 40)
                {
                    return new Rectangle(FloatDefaultLocation(new Size(w, h)), new Size(w, h));
                }

                return new Rectangle(x, y, w, h);
            }
            catch { return Rectangle.Empty; }
        }

        private Rectangle LoadFullBounds()
        {
            try
            {
                if (!File.Exists(FullPath)) return Rectangle.Empty;
                string[] parts = File.ReadAllText(FullPath).Split(',');
                if (parts.Length != 4) return Rectangle.Empty;
                Rectangle r = new Rectangle(
                    int.Parse(parts[0]), int.Parse(parts[1]),
                    int.Parse(parts[2]), int.Parse(parts[3]));
                if (r.Width < (int)(700 * _scale) || r.Height < (int)(500 * _scale)) return Rectangle.Empty;
                return r;
            }
            catch { return Rectangle.Empty; }
        }

        private void SaveBounds()
        {
            try
            {
                if (_float)
                {
                    File.WriteAllText(FloatPath, Bounds.X + "," + Bounds.Y + "," + Bounds.Width + "," + Bounds.Height);
                }
                else if (WindowState == FormWindowState.Normal)
                {
                    File.WriteAllText(FullPath, Bounds.X + "," + Bounds.Y + "," + Bounds.Width + "," + Bounds.Height);
                }
            }
            catch { }
        }

        // ---------------- 生命周期 ----------------

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (!_exiting)
            {
                e.Cancel = true;
                SaveBounds();
                Hide();
                return;
            }

            SaveBounds();
            _timeout.Stop();
            _saveTimer.Stop();

            if (_tray != null)
            {
                _tray.Visible = false;
                _tray.Dispose();
                _tray = null;
            }

            if (_web != null)
            {
                try { _web.Dispose(); } catch { }
                _web = null;
            }

            base.OnFormClosing(e);
        }

        private void ExitApp()
        {
            _exiting = true;
            Close();
            Application.Exit();
        }

        // ---------------- 自检 ----------------

        /// <summary>页面里的外链（比如 GitHub）交回系统浏览器打开，应用内不跳走</summary>
        private void OnNewWindowRequested(object sender, CoreWebView2NewWindowRequestedEventArgs e)
        {
            e.Handled = true;
            OpenExternal(e.Uri);
        }

        private void OnNavigationStarting(object sender, CoreWebView2NavigationStartingEventArgs e)
        {
            if (e.Uri.StartsWith("https://" + Program.VirtualHost, StringComparison.OrdinalIgnoreCase)) return;
            e.Cancel = true;
            OpenExternal(e.Uri);
        }

        private static void OpenExternal(string uri)
        {
            try
            {
                if (!uri.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
                    !uri.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                {
                    return;
                }
                Process.Start(new ProcessStartInfo(uri) { UseShellExecute = true });
            }
            catch { }
        }

        private void OnNavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)        {
            _timeout.Stop();
            if (!_selfTest) return;
            Finish(e.IsSuccess ? 0 : 1, e.IsSuccess ? "OK" : "NAV_FAILED: " + e.WebErrorStatus);
        }

        private void OnTimeout(object sender, EventArgs e)
        {
            _timeout.Stop();
            if (_selfTest) Finish(1, "TIMEOUT");
        }

        private void Fail(string message)
        {
            _timeout.Stop();
            if (_selfTest) { Finish(1, "ERROR: " + message); return; }
            MessageBox.Show(message, Program.AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Error);
            ExitApp();
        }

        private void Finish(int code, string text)
        {
            if (_finished) return;
            _finished = true;
            try { File.WriteAllText(Path.Combine(_appData, "selftest.txt"), text); }
            catch { }
            Environment.Exit(code);
        }
    }
}
