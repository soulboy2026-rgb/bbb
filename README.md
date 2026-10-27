# 幽灵粒子猎人：看懂 2026 诺贝尔物理学奖

一支约 6 分钟的科普动画，讲 2026 年诺贝尔物理学奖：**弗朗西斯·哈尔岑（Francis Halzen）** 因“对冰立方中微子天文台的决定性贡献，以及发现了来自天体物理源的高能中微子”独得此奖。

成片：[`out/ghost-particle-hunter-nobel2026.mp4`](out/ghost-particle-hunter-nobel2026.mp4)（1920×1080，30 fps，带中文配音、字幕和配乐）

画面、动画、配乐、音效全部由代码生成（vibe coding），没有用任何现成素材；旁白是离线 AI 语音合成。

## 内容

吉祥物“小幽”（一只中微子幽灵）带着观众，从“每秒有上百万亿个粒子穿过你的手”开始，一步步讲清楚这项研究为什么厉害。

| 时间 | 章节 | 讲什么 |
| --- | --- | --- |
| 0:00 | 开场 | 盯着你的手看一秒：上百万亿个中微子刚刚穿过了你 |
| 0:16 | 片头 | 幽灵粒子猎人 |
| 0:24 | 01 获奖的是谁 | 哈尔岑是谁；把获奖理由拆成四个关键词 |
| 0:44 | 02 幽灵粒子 | 泡利的“能量账本”、不带电几乎没质量、一光年厚的铅墙、1956 年首次捕获 |
| 1:18 | 03 为什么要抓它 | 宇宙的三位快递员：光子被尘埃拦下、宇宙线被磁场带偏、中微子笔直送达 |
| 1:56 | 04 疯狂的点子 | 把门做大：一立方公里探测器 vs 哈利法塔 / 40 万个泳池；为什么选南极冰 |
| 2:34 | 05 建造冰立方 | AMANDA 的气泡教训、86 个 2500 米深洞、5160 只“光学眼睛”、七个南极夏天 |
| 3:18 | 06 怎么抓幽灵 | μ子比冰里的光还快 → “光学音爆”（切伦科夫辐射）、事件显示、地球当过滤网 |
| 3:56 | 07 重大发现 | 2013 伯特与厄尼、2017 耀变体 TXS 0506+056、2022 NGC 1068、2023 中微子银河图 |
| 5:00 | 08 厉害在哪 | 天文学的新窗口、百年宇宙线之谜、38 年与 450 位科学家、中微子第五次获诺奖 |
| 5:47 | 09 未来 | 冰立方二代（约 8 km³）、KM3NeT、Baikal-GVD、南海“海铃” |
| 6:01 | 结尾 | 就在这一秒，又有上百万亿个幽灵穿过了你 |

## 怎么做出来的

```
script/narration.json   旁白脚本：每句字幕 + TTS 读法 + 音效提示
        │
tools/tts.py            sherpa-onnx 离线中文 TTS（matcha-icefall-zh-baker）逐句合成，
        │               量出每句时长 → web/data/timeline.json + build/narration.wav
        │
web/js/*.js             Canvas 动画：renderAt(t) 是时间的纯函数，画面节奏跟着旁白每一句走
        │
tools/music.py          numpy 合成配乐（D 大调 92 BPM 的 pad / 琶音 / 贝斯 / 鼓）和 11 种音效，
        │               旁白出现时自动压低音乐 → build/mix.wav
        │
tools/render.mjs        Playwright 无头 Chromium 逐帧截图，4 路并行，ffmpeg 编码并合成音轨
        │
out/*.mp4
```

- `web/js/core.js`：绘图工具箱（发光、文字、星空、极光、冰层、点阵地球、吉祥物“小幽”等）
- `web/js/props.js`：道具（手、奖章、泡利、冰立方 3D 阵列与事件显示、切伦科夫锥等）
- `web/js/scenes-a.js`、`web/js/scenes-b.js`：12 个场景
- `web/index.html`：既是渲染页面，也是带音轨的浏览器播放器

## 自己重新生成

需要 Node 18+、Python 3、ffmpeg、Playwright 的 Chromium。

```bash
npm install
pip install sherpa-onnx soundfile numpy scipy

# 1. 下载离线 TTS 模型（sherpa-onnx GitHub releases）
mkdir -p models && cd models
curl -LO https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/matcha-icefall-zh-baker.tar.bz2
tar xjf matcha-icefall-zh-baker.tar.bz2
curl -LO https://github.com/k2-fsa/sherpa-onnx/releases/download/vocoder-models/vocos-22khz-univ.onnx
cd ..

# 2. 地图点阵、旁白、配乐
node tools/build-map.mjs
python3 tools/tts.py --models models
python3 tools/music.py

# 3. 预览：浏览器打开 http://localhost:8123/web/index.html（可拖动进度条）
npm run serve

# 4. 渲染成片（--stills 3,20,95 可只截几帧检查；--range 60:80 可只渲染一段）
node tools/render.mjs --workers 4 --audio build/mix.wav --out out/ghost-particle-hunter-nobel2026.mp4
```

## 事实来源

- 诺贝尔奖官网 2026 物理学奖新闻稿（获奖者、获奖理由、2026 年 10 月 6 日公布）
- IceCube 合作组官网：哈尔岑获奖新闻、探测器参数（86 根串、5160 个光学模块、1450–2450 米深、2010 年 12 月完工）、合作组规模（14 个国家约 450 位科学家）
- Physics Today：1988 年的构想草图、2013 年首批高能中微子
- NASA：2017 年 9 月 22 日 IceCube-170922A 与耀变体 TXS 0506+056（红移 0.34，约 38 亿光年）
- IceCube 发表于 *Science* 的 NGC 1068（2022）与银河系平面中微子（2023）结果

视频里的数字做了通俗化处理，比如“上百万亿个中微子每秒穿过你”（太阳中微子通量的数量级估算）、“质子能量的一百多倍”（约 1 PeV 对比 LHC 约 7 TeV）。

## 素材许可

- 字体：Noto Sans SC、ZCOOL KuaiLe（SIL Open Font License，经 @fontsource 引入）
- 地图：Natural Earth（公有领域，经 world-atlas 引入）
- TTS 模型：matcha-icefall-zh-baker（sherpa-onnx 发布）
