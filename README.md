# AI Video Style Studio / AI 视频工坊

> Upload a reference video, extract its "Style DNA" with Gemini, then run a
> multi-stage pipeline — research, scripting, storyboard, image/video generation,
> TTS, and browser-side episode compilation — to produce new content in the same style.
>
> 上传参考视频，用 Gemini 解码「风格 DNA」，经调研 → 脚本 → 分镜 → 资产生成 →
> 配音 → 浏览器合成，全自动产出同风格新视频。

---

## Highlights / 项目亮点

- **Style DNA extraction / 风格 DNA 提取**：multimodal Gemini analysis of visual
  style, pacing, tone, color palette, pedagogical approach, and full transcript.
  （多模态分析画面、节奏、语调、色板、教学结构与完整转录。）
- **Five-stage pipeline / 五阶段流水线**：Strategy → Research → Scripting →
  Storyboard → Production, with human-in-the-loop approval at each gate.
- **Gemini-native production / Gemini 原生生产**：image gen, video gen with
  keyframes, Google Search grounding for research, script refinement.
- **Browser video compiler / 浏览器端合成**：Canvas + MediaRecorder stitches
  scene images/videos with TTS audio and procedural soundtrack — no FFmpeg server.
- **Style profile portability / 风格档案可导入导出**：save, load, and reuse
  Style DNA JSON across projects; built-in sample templates and mock demo mode.

## Pipeline / 处理流程

```
Reference video upload
  → Style DNA analysis (Gemini multimodal + File API)
  → Topic research (Search grounding)
  → Draft script + narrative map
  → Storyboard scenes (visual prompts + production specs)
  → Per-scene image / video / TTS generation
  → Canvas episode compile (preview & export)
```

## Tech stack / 技术栈

| Layer | Stack |
|-------|-------|
| UI | React 19 + TypeScript + Tailwind (CDN) |
| Build | Vite 6 |
| AI | `@google/genai` — Gemini Pro / Flash / Image / Video models |
| State | Custom `useStudioEngine` hook + IndexedDB checkpoints |

## Project layout / 目录结构

| Path | Role |
|------|------|
| `hooks/useStudioEngine.ts` | Pipeline orchestration & stage transitions |
| `hooks/useVideoCompiler.ts` | Browser-side episode rendering |
| `services/analysis.ts` | Style DNA extraction from reference video |
| `services/research.ts` | Topic research with Search grounding |
| `services/scripting.ts` | Script & storyboard generation |
| `services/production.ts` | Image/video asset generation |
| `services/tts.ts` | Scene narration synthesis |
| `services/videoRenderer.ts` | Canvas + MediaRecorder compile |
| `services/refinement.ts` | AI script & visual prompt refinement |
| `components/` | Studio UI — workspace, storyboard editor, preview |
| `data/` | Video templates & demo mock state |

## Prerequisites / 环境要求

- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/apikey) with access to
  multimodal, image, and video generation models (billing may apply)

## Quick start / 快速启动

```bash
cp .env.example .env.local
# Edit GEMINI_API_KEY in .env.local

npm install
npm run dev
```

Open `http://localhost:3000`.

**Demo without API key:** click "Load Demo" in the header to explore the UI with
pre-filled mock state.

## Environment / 环境变量

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key (injected at build time via Vite) |

## Build / 构建

```bash
npm run build
npm run preview
```

## License

MIT — see [LICENSE](LICENSE).

## Author

He Shuting (何淑婷) — [he18718143986-design](https://github.com/he18718143986-design)
