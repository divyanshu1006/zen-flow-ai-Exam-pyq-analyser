import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

// ===== STARTUP VALIDATION =====
if (!process.env.GEMINI_API_KEY) {
  console.error('\n❌ GEMINI_API_KEY is missing from your .env file!')
  console.error('   Create a .env file in the project root with:')
  console.error('   GEMINI_API_KEY=your_key_here\n')
  process.exit(1)
}

// ============================================================
// ANALYSIS PROMPT — Edit this to change what the AI analyzes
// ============================================================
const EXAM_ANALYSIS_PROMPT = `**ROLE:** You are an expert university exam strategist and analyst. I have uploaded all my Previous Year Question Papers (PYQs) and my syllabus. Your job is to run a **complete 7-layer analysis** and give me everything I need to score 80%+ — including what to study hard, what to study lightly, and what to drop entirely.

---

## 🔴 GROUND RULES BEFORE YOU BEGIN

- Treat the **last 2–3 years as highest priority** — weight them more than older papers
- Every question with parts **(a), (b), (c)** must be broken down and analyzed **part by part** — do not treat them as one whole question
- Every recommendation must be backed by **actual PYQ evidence** — no assumptions
- Never recommend skipping a topic without stating **exact marks at risk**
- Clearly separate **observed patterns** from **predictions**

---

## 📊 LAYER 1 — MARKS-WEIGHT ANALYSIS

*(Know which units are worth the most marks before anything else)*

**WHAT TO DO:**

- Extract the **marks allocated** to every question in every year paper
- Map total marks to each unit across all years
- Find if any unit consistently carries more marks than others
- Identify the **marks distribution pattern** — does it stay the same every year or shift?

**OUTPUT:**

### 💰 Unit-Wise Marks Distribution Table

| Unit | Unit Name | [Year 1] Marks | [Year 2] Marks | [Year 3] Marks | Avg Marks | % of Total Paper | Priority Tier |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Unit 1 | [Name] | 15 | 15 | 20 | 16.7 | 22% | 🔴 High |
| Unit 2 | [Name] | 10 | 10 | 10 | 10 | 13% | 🟡 Medium |

🎯 **To score 80% you need [X] marks out of [Total]. These units alone cover it:** [List units]

---

### 📐 Marks Pattern Observations

- Is the marks split **fixed every year** or does it rotate?
- Which unit gives the **highest marks for least effort** based on question type?
- Which unit has **high marks but hard questions** — risky to rely on?
- Which unit has **low marks but easy questions** — quick wins?

---

## 📅 LAYER 2 — RECENCY FILTER

*(Last 2–3 years predict the future better than older papers)*

**WHAT TO DO:**

- Re-analyze all questions but apply a **recency weight:**
    - Last year paper → Weight: 🔴 3x
    - 2 years ago → Weight: 🟡 2x
    - 3 years ago → Weight: 🟢 1.5x
    - Older than 3 years → Weight: ⚪ 0.5x
- Flag any question or topic that was **common before but has disappeared in recent years** — these are fading patterns
- Flag any question or topic that has **only started appearing in recent years** — these are rising patterns

**OUTPUT:**

### 📈 Recency-Weighted Priority Table

| Unit | Question / Topic | Raw Frequency | Recency Weight | Weighted Score | Trend | Action |
| --- | --- | --- | --- | --- | --- | --- |
| Unit 1 | [Topic] | 4x | 3x (last year) | 🔴 12 | Rising ↑ | Must Prepare |
| Unit 2 | [Topic] | 3x | 0.5x (pre-2020) | ⚪ 1.5 | Fading ↓ | Low Priority |

---

### 🔺 Rising Topics (New Pattern — High Alert)

Topics that have started appearing only in last 2–3 years — examiner may be shifting focus here

| Unit | Topic | First Appeared | Times Since | Signal Strength |
| --- | --- | --- | --- | --- |

---

### 🔻 Fading Topics (Old Pattern — Losing Relevance)

Topics that used to appear but have vanished in recent years — examiner may have moved on

| Unit | Topic | Last Appeared | Years Silent | Risk If You Study This |
| --- | --- | --- | --- | --- |

---

## 🔬 LAYER 3 — PART (a)(b)(c) SPLIT ANALYSIS

*(Hidden patterns live inside sub-questions — most students miss this completely)*

**WHAT TO DO:**

- Break every question that has sub-parts into individual parts
- Analyze each part separately across all years
- Find which **sub-parts repeat** even when the main question number changes
- Find which **sub-parts always change** even when the main topic stays the same
- Find if there is a pattern like **"Part (a) is always definition, Part (b) is always numerical"**

**OUTPUT:**

### 🧩 Sub-Part Pattern Table — Unit by Unit

---

### 📘 UNIT [X] — [Unit Name]

| Year | Full Question | Part (a) | Part (b) | Part (c) |
| --- | --- | --- | --- | --- |
| 2019 | Q[X] | [Sub-question text] | [Sub-question text] | [Sub-question text] |
| 2020 | Q[X] | [Sub-question text] | [Sub-question text] | [Sub-question text] |
| 2021 | Q[X] | [Sub-question text] | [Sub-question text] | — |

### 🔍 Sub-Part Behavior Analysis:

- **Part (a) pattern:** [e.g., "Always asks for definition or formula — never changes type"]
- **Part (b) pattern:** [e.g., "Rotates between numerical and diagram every alternate year"]
- **Part (c) pattern:** [e.g., "Only appears in 60% of years — optional or bonus"]
- **Which sub-part repeats most:** [e.g., "Part (a) repeated exact wording in 2019 and 2022"]
- **Which sub-part is unpredictable:** [e.g., "Part (b) changes topic every single year"]
- **Marks split per sub-part:** [e.g., "a=2, b=5, c=3 — Part (b) carries most weight"]

---

**Repeat this for every unit.**

---

## 🗑️ LAYER 4 — SKIP LIST / EFFICIENCY BUCKETS

*(Stop wasting time — ruthlessly cut low-return material)*

Cross-reference every syllabus topic against PYQs and classify into 3 buckets:

---

### 🗑️ BUCKET 0 — LEAVE COMPLETELY

*(Zero time investment — these topics have worst ROI)*

| Unit | Topic | Reason To Leave | Marks At Risk |
| --- | --- | --- | --- |
| Unit 2 | [Topic] | Never appeared in any year | 0 |
| Unit 4 | [Topic] | Appeared once in 2015, silent since + fading trend | Minimal |

🧮 **Total marks safely skippable:** [X] out of [Total]

⚠️ **Safety Check before skipping anything in Bucket 0:**

- Is this topic connected to a high-frequency topic? → If yes, move to Bucket 1
- Does skipping this leave an entire unit uncovered? → If yes, at least glance
- Is this topic new to the syllabus and untested yet? → If yes, flag as unpredictable danger zone
- Did it appear in the recency filter as a **rising topic**? → If yes, do NOT skip — move to Bucket 2

---

### ⚡ BUCKET 1 — ONE GLANCE ONLY

*(Read once — if it comes, attempt. If not, move on.)*

| Unit | Topic | Last Appeared | Recency Status | Why Only Glance | What To Glance At |
| --- | --- | --- | --- | --- | --- |
| Unit 1 | [Topic] | 2019 | Fading ↓ | Appeared once, replaced since | Definition only |
| Unit 3 | [Topic] | 2020 | Neutral | Low marks, simple answer | One formula |

⏱️ **Total time for all Bucket 1 topics:** [X hours max]

---

### 📖 BUCKET 2 — LIGHT PREP (2 Questions Max)

*(Some attention needed — but strictly cap at 2 practice questions)*

| Unit | Topic | Times Appeared | Recency Status | Why Light Prep | The 2 Questions To Practice |
| --- | --- | --- | --- | --- | --- |
| Unit 2 | [Topic] | 2x | Neutral | Not recent, medium marks | Q1 / Q2 |
| Unit 5 | [Topic] | 2x | Rising ↑ | New pattern forming | Q1 / Q2 |

⏱️ **Total time for all Bucket 2 topics:** [X hours max]

---

## 🔁 LAYER 5 — REPEAT PAIRS ACROSS YEARS

*(Questions that came back — unit by unit)*

For every unit, find questions appearing in **more than one year** and show original wording side by side:

---

### 📘 UNIT [X] — [Unit Name]

### 🔁 Repeat Group [1] — Appeared [N] times | 🔴 HIGH PRIORITY

| Year | Exact Question As Written | Marks |
| --- | --- | --- |
| 2021 | [Exact text] | [X] |
| 2023 | [Exact text] | [X] |

💡 **Core Concept Being Tested:** [One line]
📝 **Verdict:** Exact repeat / Same concept reworded
📅 **Recency Status:** 🔴 Appeared last year — extremely high chance of return

---

## 🔄 LAYER 6 — NON-REPEATING SLOT BEHAVIOR

*(Decode what the examiner does in the unpredictable slot)*

For every unit, analyze questions that appeared **only once** and find the examiner's rotation logic:

---

### 📘 UNIT [X] — [Unit Name]

| Year | Exact Question | Topic/Sub-Topic | Question Type | Marks |
| --- | --- | --- | --- | --- |
| 2019 | [Text] | [Sub-topic] | [Type] | [X] |
| 2020 | [Text] | [Sub-topic] | [Type] | [X] |

### 🧠 Examiner Behavior:

- **What is the examiner rotating through?**
- **What type of question does this slot always get?**
- **Replacement pattern:** Topic A → Topic B → Topic C → ?
- **Topics never appeared yet from syllabus** (overdue — danger zone)
- **Most likely next question with reasoning**

---

## 🏆 LAYER 7 — MASTER PRIORITY LIST FOR 95%

*(Everything combined into one final action plan)*

### 🎯 Topic Priority Table — Combined Score

| Unit | Topic | Frequency | Recency Weight | Marks Value | Sub-Part Stability | Bucket | Final Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Unit 1 | [Topic] | 4x | 🔴 3x | 15 marks | Part(a) always same | Must Do | 🔴 P1 |
| Unit 2 | [Topic] | 2x | 🟡 2x | 10 marks | Part(b) varies | Prepare | 🟡 P2 |
| Unit 3 | [Topic] | 1x | ⚪ 0.5x | 5 marks | Unstable | Bucket 1 | 🟢 P3 |

---

### 📋 Final Action Checklist

**🔴 PREPARE FULLY — These guarantee your 80%:**

- [ ]  [Topic — Unit X — appeared Nx — last seen Year — worth X marks]

**🟡 PREPARE LIGHTLY — Safety buffer:**

- [ ]  [Topic — Unit X — 2 questions max]

**⚡ GLANCE ONLY — 30 mins max each:**

- [ ]  [Topic — Unit X — definition/formula only]

**🗑️ DO NOT TOUCH — Zero ROI:**

- [ ]  [Topic — Unit X — confirmed skip]

---

### 📊 80% Safety Calculator

| Category | Topics Count | Marks Covered | % of Paper |
| --- | --- | --- | --- |
| 🔴 Full Prep topics | [N] | [X] marks | [X]% |
| 🟡 Light Prep topics | [N] | [X] marks | [X]% |
| ⚡ Glance topics | [N] | [X] marks | [X]% |
| 🗑️ Skipped topics | [N] | [X] marks risked | [X]% |
| **TOTAL SECURED** |  | **[X] marks** | **[X]%** |

✅ **Confirmed: Following this plan secures [X]% — safely above your 80% target**

---

## ❌ MASTER STRICT RULES

- ✅ Weight last 2–3 years **3x more** than older papers in every recommendation
- ✅ Break every multi-part question into **(a)(b)(c)** before any analysis
- ✅ Every skip must include **exact marks at risk**
- ✅ Every prediction must include **reasoning from actual evidence**
- ✅ Sort everything from **highest to lowest priority**
- ❌ Never put a **recently appeared topic** (last 2 years) in Bucket 0
- ❌ Never treat a **multi-part question as one unit** — always split
- ❌ Never recommend skipping a topic that is the **only source for an entire unit**
- ❌ Never mix **observed patterns** with **predictions** — label them separately always`

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir)
}

// Multer for file uploads (disk storage for Gemini File API)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
      cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf')
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  },
})

// Initialize Gemini
let ai
try {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
} catch (err) {
  console.error('\n❌ Failed to initialize Gemini SDK:', err.message)
  process.exit(1)
}

// Helper function to extract text from a PDF file using pdfjs-dist
async function extractTextFromPDF(pdfPath) {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const pdfBuffer = fs.readFileSync(pdfPath)
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true
    })
    const pdfDoc = await loadingTask.promise
    let fullText = ""
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      fullText += `--- Page ${i} ---\n${pageText}\n\n`
    }
    return fullText
  } catch (err) {
    console.error("Text extraction failed:", err.message)
    return ""
  }
}

// Helper function to split a large PDF into smaller chunks under 40MB
async function splitPDFIntoChunks(pdfPath, tempDir, originalSize) {
  const { PDFDocument } = await import('pdf-lib')
  const pdfBytes = fs.readFileSync(pdfPath)
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const totalPages = pdfDoc.getPages().length
  
  const S = originalSize / (1024 * 1024)
  const numChunks = Math.ceil(S / 40) // Target ~40MB per chunk
  const pagesPerChunk = Math.ceil(totalPages / numChunks)
  
  const chunkPaths = []
  
  for (let i = 0; i < numChunks; i++) {
    const startPage = i * pagesPerChunk
    const endPage = Math.min((i + 1) * pagesPerChunk, totalPages)
    
    if (startPage >= totalPages) break
    
    const subDocument = await PDFDocument.create()
    const pageIndices = []
    for (let p = startPage; p < endPage; p++) {
      pageIndices.push(p)
    }
    
    const copiedPages = await subDocument.copyPages(pdfDoc, pageIndices)
    for (const page of copiedPages) {
      subDocument.addPage(page)
    }
    
    const subPdfBytes = await subDocument.save()
    const chunkPath = path.join(tempDir, `chunk-${Date.now()}-${i}.pdf`)
    fs.writeFileSync(chunkPath, subPdfBytes)
    chunkPaths.push(chunkPath)
  }
  
  return chunkPaths
}

// === ANALYSIS ENDPOINT ===
app.post('/api/analyze', (req, res, next) => {
  upload.single('pdf')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'FILE_TOO_LARGE', message: 'File too large. Maximum size is 100MB.' })
      }
      if (err.message === 'Only PDF files are allowed') {
        return res.status(415).json({ error: 'INVALID_FILE_TYPE', message: 'Only PDF files are supported. Please upload a .pdf file.' })
      }
      return res.status(400).json({ error: 'UPLOAD_FAILED', message: err.message || 'File upload failed.' })
    }
    next()
  })
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'NO_FILE', message: 'No PDF file uploaded.' })
  }

  let uploadResult;
  let chunkPaths = [];
  let uploadedFiles = [];

  try {
    const fileSizeMB = req.file.size / (1024 * 1024)
    console.log(`📄 Received PDF: ${req.file.originalname} (${fileSizeMB.toFixed(1)} MB)`)

    let resultStream;
    const isLargeFile = req.file.size > 50 * 1024 * 1024; // 50MB

    if (isLargeFile) {
      console.log(`⚠️ PDF exceeds 50MB. Attempting to split into smaller chunks...`)
      
      try {
        chunkPaths = await splitPDFIntoChunks(req.file.path, uploadsDir, req.file.size)
        
        const uploadPromises = chunkPaths.map(async (chunkPath, i) => {
          const chunkMB = fs.statSync(chunkPath).size / (1024 * 1024)
          console.log(`📤 Uploading chunk ${i+1}/${chunkPaths.length} (${chunkMB.toFixed(1)} MB) to Gemini Files API...`)
          
          const uploadRes = await ai.files.upload({
            file: chunkPath,
            mimeType: 'application/pdf'
          })
          console.log(`✅ Uploaded chunk ${i+1}: ${uploadRes.name}`)
          return uploadRes
        })

        uploadedFiles = await Promise.all(uploadPromises)
        
        // Wait for all uploaded chunks to be ACTIVE
        const checkPromises = uploadedFiles.map(async (file) => {
          let fileState = await ai.files.get({ name: file.name })
          while (fileState.state === 'PROCESSING') {
            console.log(`⏳ Chunk ${file.name} state: ${fileState.state}. Waiting 1 second...`)
            await new Promise(resolve => setTimeout(resolve, 1000))
            fileState = await ai.files.get({ name: file.name })
          }
          if (fileState.state !== 'ACTIVE') {
            throw new Error(`Chunk processing failed for ${file.name} with state: ${fileState.state}`)
          }
        })
        await Promise.all(checkPromises)
        console.log('✅ All chunks are ACTIVE and ready for analysis')

        const fileDataParts = uploadedFiles.map(file => ({
          fileData: {
            fileUri: file.uri,
            mimeType: file.mimeType
          }
        }))

        console.log('🤖 Sending all chunks to Gemini for analysis (streaming)...')
        resultStream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                ...fileDataParts,
                { text: EXAM_ANALYSIS_PROMPT }
              ]
            }
          ],
          config: {
            temperature: 0.2,
            maxOutputTokens: 65536
          }
        })
        
      } catch (splitErr) {
        console.error('Failed to process large PDF by splitting:', splitErr.message)
        
        // Fall back to text extraction if splitting fails
        console.log('🔄 Falling back to plain text extraction...')
        const extractedText = await extractTextFromPDF(req.file.path)
        if (extractedText.trim().length > 1000) {
          console.log(`✅ Extracted ${extractedText.length} characters of text. Sending text directly to Gemini (streaming)...`)
          resultStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `Below is the text content extracted from the exam PDF. Please use it for your analysis:\n\n${extractedText}` },
                  { text: EXAM_ANALYSIS_PROMPT }
                ]
              }
            ],
            config: {
              temperature: 0.2,
              maxOutputTokens: 65536
            }
          })
        } else {
          console.log('❌ Large file text extraction also yielded too little text.')
          throw new Error('FILE_TOO_LARGE_AND_SCANNED')
        }
      }
      
    } else {
      console.log('📤 Uploading PDF to Gemini Files API...')
      uploadResult = await ai.files.upload({
        file: req.file.path,
        mimeType: 'application/pdf'
      })
      console.log(`✅ Uploaded to Gemini Files API: ${uploadResult.name}`)

      // Wait for the file to be processed and become ACTIVE
      let fileState = await ai.files.get({ name: uploadResult.name })
      while (fileState.state === 'PROCESSING') {
        console.log(`⏳ File state: ${fileState.state}. Waiting 1 second...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        fileState = await ai.files.get({ name: uploadResult.name })
      }

      if (fileState.state !== 'ACTIVE') {
        throw new Error(`File processing failed with state: ${fileState.state}`)
      }
      console.log('✅ File is ACTIVE and ready for analysis')

      console.log('🤖 Sending to Gemini for analysis (streaming)...')

      resultStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                fileData: {
                  fileUri: uploadResult.uri,
                  mimeType: uploadResult.mimeType
                }
              },
              { text: EXAM_ANALYSIS_PROMPT }
            ]
          }
        ],
        config: {
          temperature: 0.2,
          maxOutputTokens: 65536
        }
      })
    }

    // Now set up streaming response to the client
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Transfer-Encoding', 'chunked')

    for await (const chunk of resultStream) {
      if (chunk.text) {
        res.write(chunk.text)
      }
    }
    res.end()

    // Cleanups
    fs.unlink(req.file.path, () => {})
    for (const chunkPath of chunkPaths) {
      fs.unlink(chunkPath, () => {})
    }
    if (uploadResult && uploadResult.name) {
      try {
        await ai.files.delete({ name: uploadResult.name })
        console.log('🧹 Cleaned up original file from Gemini Files API')
      } catch (cleanupErr) {
        console.warn('⚠️ Non-critical cleanup error:', cleanupErr.message)
      }
    }
    for (const file of uploadedFiles) {
      try {
        await ai.files.delete({ name: file.name })
        console.log(`🧹 Cleaned up chunk ${file.name} from Gemini Files API`)
      } catch (cleanupErr) {
        console.warn(`⚠️ Non-critical cleanup error for ${file.name}:`, cleanupErr.message)
      }
    }
    console.log('✅ Analysis complete')


  } catch (err) {
    console.error('Analysis error:', err.message)

    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {})
    }
    for (const chunkPath of chunkPaths) {
      try {
        fs.unlinkSync(chunkPath)
      } catch (_) {}
    }
    if (uploadResult && uploadResult.name) {
      try {
        await ai.files.delete({ name: uploadResult.name })
      } catch (_) {}
    }
    for (const file of uploadedFiles) {
      try {
        await ai.files.delete({ name: file.name })
      } catch (_) {}
    }

    if (err.message === 'FILE_TOO_LARGE_AND_SCANNED') {
      const sizeStr = req.file ? `${(req.file.size / (1024 * 1024)).toFixed(1)} MB` : 'exceeding 50 MB'
      return res.status(413).json({
        error: 'FILE_TOO_LARGE',
        message: `This PDF file (${sizeStr}) exceeds the 50 MB limit for single files. Since this is a scanned document (containing no selectable text), we cannot extract the text. Please compress the PDF to under 50 MB and try again.`
      })
    }

    if (err?.status === 429 || err?.message?.includes('429')) {
      return res.status(429).json({ error: 'RATE_LIMITED', message: 'AI service is busy. Wait 30–60 seconds and try again.' })
    }
    return res.status(500).json({ error: 'ANALYSIS_FAILED', message: err.message || 'Analysis failed.' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  })
})

app.listen(PORT, () => {
  console.log(`\n🚀 Exam Ace AI Server running on http://localhost:${PORT}`)
  console.log(`   POST /api/analyze  — Upload PDF for Gemini analysis`)
  console.log(`   GET  /api/health   — Health check`)
  console.log(`\n   ✅ GEMINI_API_KEY loaded successfully\n`)
})
