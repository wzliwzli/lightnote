"""生成轻笺的应用图标（256px 圆角方块 + 对勾），输出多尺寸 .ico"""
from PIL import Image, ImageDraw

SIZE = 256
BRAND_TOP = (79, 193, 166)     # #4FC1A6
BRAND_BOTTOM = (47, 160, 137)  # #2FA089

img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

# 竖向渐变
grad = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
gd = ImageDraw.Draw(grad)
for y in range(SIZE):
    t = y / (SIZE - 1)
    r = int(BRAND_TOP[0] + (BRAND_BOTTOM[0] - BRAND_TOP[0]) * t)
    g = int(BRAND_TOP[1] + (BRAND_BOTTOM[1] - BRAND_TOP[1]) * t)
    b = int(BRAND_TOP[2] + (BRAND_BOTTOM[2] - BRAND_TOP[2]) * t)
    gd.line([(0, y), (SIZE, y)], fill=(r, g, b, 255))

mask = Image.new("L", (SIZE, SIZE), 0)
md = ImageDraw.Draw(mask)
md.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=58, fill=255)

img.paste(grad, (0, 0), mask)

# 对勾
draw = ImageDraw.Draw(img)
points = [(76, 132), (114, 170), (184, 92)]
draw.line(points, fill=(255, 255, 255, 255), width=22, joint="curve")
# 圆角端点
for p in (points[0], points[-1]):
    r = 11
    draw.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=(255, 255, 255, 255))

img.save(
    r"E:\DeepseekHarness\lightnote\desktop\src\app.ico",
    format="ICO",
    sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (24, 24), (16, 16)],
)
print("icon ok")
