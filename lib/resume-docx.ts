// Tailor a Word (.docx) resume without touching its design: only the words inside
// existing text runs change, and bullets can be reordered within the same group.
// Fonts, sizes, spacing, columns, tables and styles all stay exactly as they were.
import JSZip from "jszip"

export type ResumeLine = {
  id: string
  kind: "heading" | "bullet" | "paragraph" | "other"
  text: string
  editable: boolean
  /** Bullets that sit next to each other share a group and may be reordered */
  group?: string
  /** When a line mixes formatting (e.g. a bold lead-in), the text of each formatted part */
  segments?: string[]
}

export type ParsedResume = {
  lines: ResumeLine[]
  /** All text in the resume, used to check that edits don't invent facts */
  fullText: string
}

export type TailorEdit = { id: string; text?: string; segments?: string[] }
export type TailorReorder = { group: string; order: string[] }
export type TailorChange = { kind: "reworded" | "moved"; before: string; after: string }

type Run = {
  start: number
  end: number
  rPr: string
  /** fixed: a typed bullet before any words, which is never edited */
  texts: { start: number; end: number; value: string; fixed?: boolean }[]
}
type Paragraph = {
  start: number
  end: number
  xml: string
  text: string
  runs: Run[]
  line: ResumeLine
}

const DOCUMENT = "word/document.xml"
const bulletChars = /^[\s]*[•▪●◦‣∙·\-–—*]\s+/

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
}

function encodeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/** Innermost <w:p> elements, found with depth tracking so text boxes and nested content are handled */
function findParagraphs(xml: string) {
  const found: { start: number; end: number }[] = []
  const stack: { start: number; hasChild: boolean }[] = []
  const tag = /<w:p(?=[\s>/])[^>]*?(\/?)>|<\/w:p>/g

  for (let match = tag.exec(xml); match; match = tag.exec(xml)) {
    if (match[0].startsWith("</")) {
      const open = stack.pop()
      if (!open) continue
      if (stack.length) stack[stack.length - 1].hasChild = true
      if (!open.hasChild) found.push({ start: open.start, end: match.index + match[0].length })
    } else if (match[1] === "/") {
      continue // empty <w:p/>
    } else {
      stack.push({ start: match.index, hasChild: false })
    }
  }

  return found.sort((left, right) => left.start - right.start)
}

function parseRuns(paragraphXml: string): Run[] {
  const runs: Run[] = []
  const runPattern = /<w:r(?=[\s>])[^>]*>([\s\S]*?)<\/w:r>/g

  for (let match = runPattern.exec(paragraphXml); match; match = runPattern.exec(paragraphXml)) {
    const body = match[1]
    const bodyOffset = match.index + match[0].indexOf(">") + 1
    const rPr = body.match(/<w:rPr>[\s\S]*?<\/w:rPr>|<w:rPr\/>/)?.[0] ?? ""
    const texts: Run["texts"] = []
    const textPattern = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:t(?:\s[^>]*)?\/>/g
    for (let text = textPattern.exec(body); text; text = textPattern.exec(body)) {
      texts.push({ start: bodyOffset + text.index, end: bodyOffset + text.index + text[0].length, value: decodeXml(text[1] ?? "") })
    }
    runs.push({ start: match.index, end: match.index + match[0].length, rPr, texts })
  }

  // Leading text that is only a bullet character stays exactly as it is
  let seenWords = false
  for (const run of runs) {
    for (const text of run.texts) {
      if (seenWords) continue
      if (/^[\s•▪●◦‣∙·\-–—*]*$/.test(text.value)) text.fixed = true
      else seenWords = true
    }
  }
  return runs
}

/** Things we never edit inside: links, fields, images, text boxes, line breaks and tabs */
const unsafeContent = /<w:hyperlink|<w:fldSimple|<w:instrText|<w:fldChar|<w:drawing|<w:pict|<mc:AlternateContent|<w:sym|<w:br\/>|<w:ptab|<w:object|<w:ins |<w:del /

/** Text with tabs shown as "\t", in document order */
function textWithTabs(paragraphXml: string) {
  let text = ""
  const token = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>/g
  for (let match = token.exec(paragraphXml); match; match = token.exec(paragraphXml)) {
    text += match[0] === "<w:tab/>" ? "\t" : decodeXml(match[1] ?? "")
  }
  return text
}

/** Tabs are fine only when they follow a typed bullet ("•<tab>Led the…"); elsewhere they align layout */
function tabsAreSafe(text: string) {
  if (!text.includes("\t")) return true
  const beforeLastTab = text.slice(0, text.lastIndexOf("\t"))
  return /^[\s•▪●◦‣∙·\-–—*]*$/.test(beforeLastTab)
}

const bulletOnly = /^[\s•▪●◦‣∙·\-–—*]*$/

/** The formatted parts that hold words (a separate run containing only the bullet stays as-is) */
function wordSegments(runs: Run[]) {
  return segmentsOf(runs).filter((segment) => !bulletOnly.test(segment.text))
}

function classify(paragraphXml: string, text: string): ResumeLine["kind"] {
  const trimmed = text.trim()
  if (!trimmed) return "other"
  const isList = /<w:numPr>/.test(paragraphXml) || /<w:pStyle w:val="[^"]*List[^"]*"/i.test(paragraphXml) || bulletChars.test(trimmed)
  if (isList) return "bullet"
  // A comma-separated list (usually skills) can be reworded and reordered like a paragraph
  if (trimmed.length >= 30 && (trimmed.match(/,/g) ?? []).length >= 3) return "paragraph"
  if (trimmed.length <= 60 && !/[.!?]$/.test(trimmed)) return "heading"
  if (trimmed.length >= 80) return "paragraph"
  return "other"
}

/**
 * The visible formatting of a run. Invisible tweaks (letter spacing, kerning, language,
 * proofing, complex-script sizes) are ignored. Documents converted from PDF set these on
 * nearly every space, which would otherwise split one line into dozens of "formats".
 */
function visibleFormat(rPr: string) {
  return rPr
    .replace(/<w:(spacing|kern|w|position|lang|noProof|szCs|bCs|iCs|webHidden|snapToGrid|fitText|eastAsianLayout)\b[^>]*\/>/g, "")
    .replace(/<w:rPr\/>|<\/?w:rPr>/g, "")
    .replace(/\s+/g, "")
}

/** Group the runs of a paragraph into parts with the same visible formatting */
function segmentsOf(runs: Run[]) {
  const segments: { rPr: string; runs: Run[]; text: string }[] = []
  for (const run of runs) {
    const text = run.texts.filter((item) => !item.fixed).map((item) => item.value).join("")
    if (!text) continue
    const last = segments[segments.length - 1]
    // Spaces join the part they sit in rather than starting a new one
    if (last && (visibleFormat(last.rPr) === visibleFormat(run.rPr) || !text.trim())) {
      last.runs.push(run)
      last.text += text
    } else {
      segments.push({ rPr: run.rPr, runs: [run], text })
    }
  }
  return segments
}

function looksLikeContact(text: string) {
  return /@|\bhttps?:\/\/|\bwww\.|linkedin\.com|\(\d{3}\)|\d{3}[-.\s]\d{3}[-.\s]\d{4}/i.test(text)
}

async function load(buffer: ArrayBuffer | Uint8Array) {
  const zip = await JSZip.loadAsync(buffer)
  const file = zip.file(DOCUMENT)
  if (!file) throw new Error("This doesn't look like a Word document.")
  const xml = await file.async("string")
  return { zip, xml }
}

/** Sections whose wording is factual (degrees, awards, certifications): reorder only, never reword */
const factualSection = /^(education|certifications?|licen[cs]es?|awards?|honou?rs|achievements?|publications?|patents?|references?|languages?)\b/i

function analyze(xml: string) {
  const paragraphs: Paragraph[] = []
  let index = 0
  let inFactualSection = false

  for (const { start, end } of findParagraphs(xml)) {
    const paragraphXml = xml.slice(start, end)
    const runs = parseRuns(paragraphXml)
    const text = runs.map((run) => run.texts.map((item) => item.value).join("")).join("")
    if (!text.trim()) continue

    const tabbed = textWithTabs(paragraphXml)
    const kind = classify(paragraphXml, tabbed)
    if (kind === "heading" && text.trim().length <= 40) inFactualSection = factualSection.test(text.trim())
    const segments = wordSegments(runs)
    const editable =
      !inFactualSection &&
      (kind === "bullet" || kind === "paragraph") &&
      text.trim().length >= 25 &&
      !unsafeContent.test(paragraphXml) &&
      tabsAreSafe(tabbed) &&
      !looksLikeContact(text) &&
      segments.length > 0 &&
      segments.length <= 8

    paragraphs.push({
      start,
      end,
      xml: paragraphXml,
      text,
      runs,
      line: {
        id: `p${index++}`,
        kind,
        text: (editable ? segments.map((segment) => segment.text).join("") : tabbed.replace(/\t+/g, " ")).trim(),
        editable,
        ...(editable && segments.length > 1 ? { segments: segments.map((segment) => segment.text) } : {}),
      },
    })
  }

  // Bullets that are direct neighbours in the document form a group (one job's bullets)
  let group = 0
  for (let i = 0; i < paragraphs.length; i += 1) {
    const current = paragraphs[i]
    if (current.line.kind !== "bullet") continue
    const previous = paragraphs[i - 1]
    const adjacent = previous && previous.line.kind === "bullet" && previous.line.group && !xml.slice(previous.end, current.start).trim()
    current.line.group = adjacent ? previous.line.group : `g${group++}`
  }

  return paragraphs
}

/** Read a resume into lines the model can work with */
export async function parseResume(buffer: ArrayBuffer | Uint8Array): Promise<ParsedResume> {
  const { xml } = await load(buffer)
  const paragraphs = analyze(xml)
  if (paragraphs.length === 0) throw new Error("No text was found in this document.")
  return { lines: paragraphs.map((paragraph) => paragraph.line), fullText: paragraphs.map((paragraph) => paragraph.text).join("\n") }
}

// ---------------------------------------------------------------------------
// Checking edits
// ---------------------------------------------------------------------------
function numbersIn(text: string) {
  return (text.match(/\$?\d[\d,.]*\s?[%kKmMx+]?/g) ?? []).map((item) => item.replace(/[\s,]/g, "").toLowerCase())
}

/** Why an edit is unsafe, or null when it's fine */
function rejectEdit(original: string, next: string, resumeText: string) {
  const before = original.trim()
  const after = next.trim()
  if (!after) return "empty"
  // A few characters of growth at most: more can wrap onto a new line and push the resume onto another page
  if (after.length > before.length + Math.max(4, Math.round(before.length * 0.03))) return "too long (could add a line)"
  if (after.length < before.length * 0.6) return "too short"
  const known = new Set(numbersIn(resumeText))
  if (numbersIn(after).some((number) => !known.has(number))) return "adds a number that isn't in your resume"
  return null
}

/** Keep a typed bullet character ("• ") if the original line had one */
function keepBullet(original: string, next: string) {
  const bullet = original.match(bulletChars)?.[0]
  if (!bullet) return next.replace(bulletChars, "")
  return bulletChars.test(next) ? next : `${bullet}${next.trimStart()}`
}

export type TailorResult = {
  buffer: Uint8Array
  changes: TailorChange[]
  rejected: { before: string; reason: string }[]
}

/** Apply checked edits and reorders, returning a new .docx */
export async function applyTailoring(
  buffer: ArrayBuffer | Uint8Array,
  edits: TailorEdit[],
  reorders: TailorReorder[],
): Promise<TailorResult> {
  const { zip, xml } = await load(buffer)
  const paragraphs = analyze(xml)
  const byId = new Map(paragraphs.map((paragraph) => [paragraph.line.id, paragraph]))
  const resumeText = paragraphs.map((paragraph) => paragraph.text).join("\n")
  const changes: TailorChange[] = []
  const rejected: TailorResult["rejected"] = []
  const newXml = new Map<string, string>()

  for (const edit of edits) {
    const paragraph = byId.get(edit.id)
    if (!paragraph || !paragraph.line.editable) continue
    const segments = wordSegments(paragraph.runs)

    // The new text for each formatted part
    let parts: string[]
    if (segments.length === 1) {
      if (typeof edit.text !== "string") continue
      parts = [keepBullet(segments[0].text, edit.text)]
    } else {
      if (!Array.isArray(edit.segments) || edit.segments.length !== segments.length) continue
      parts = edit.segments.map((part, index) => (index === 0 ? keepBullet(segments[0].text, String(part)) : String(part)))
    }

    // Preserve the original spacing between formatted parts (e.g. "Led: " + "the redesign")
    parts = parts.map((part, index) => {
      const original = segments[index].text
      const lead = original.match(/^\s*/)?.[0] ?? ""
      const trail = original.match(/\s*$/)?.[0] ?? ""
      return `${lead}${part.trim()}${trail}`
    })

    const nextText = parts.join("")
    if (nextText.trim() === paragraph.text.trim()) continue
    const reason = rejectEdit(paragraph.text, nextText, resumeText)
    if (reason) {
      rejected.push({ before: paragraph.text.trim(), reason })
      continue
    }

    // Rewrite text inside the existing runs only: the first <w:t> of each part gets the
    // new words, the rest are emptied. Run formatting (<w:rPr>) is never touched.
    const replacements: { start: number; end: number; value: string }[] = []
    segments.forEach((segment, segmentIndex) => {
      let placed = false
      for (const run of segment.runs) {
        for (const text of run.texts) {
          if (text.fixed) continue
          replacements.push({
            start: text.start,
            end: text.end,
            value: placed ? "" : `<w:t xml:space="preserve">${encodeXml(parts[segmentIndex])}</w:t>`,
          })
          placed = true
        }
      }
    })
    let updated = paragraph.xml
    for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
      updated = updated.slice(0, replacement.start) + replacement.value + updated.slice(replacement.end)
    }

    newXml.set(paragraph.line.id, updated)
    changes.push({ kind: "reworded", before: paragraph.text.trim(), after: nextText.trim() })
  }

  // Reorder bullets within their own group
  const order = new Map<string, string>() // position id -> id of the paragraph that goes there
  for (const reorder of reorders) {
    const members = paragraphs.filter((paragraph) => paragraph.line.group === reorder.group).map((paragraph) => paragraph.line.id)
    const proposed = Array.isArray(reorder.order) ? reorder.order.map(String) : []
    const isPermutation = proposed.length === members.length && members.every((id) => proposed.includes(id))
    if (!isPermutation || proposed.every((id, index) => id === members[index])) continue
    members.forEach((positionId, index) => order.set(positionId, proposed[index]))
    const first = byId.get(proposed[0])
    // Report the bullet that now leads the group
    if (first && proposed[0] !== members[0]) changes.push({ kind: "moved", before: "", after: first.text.trim() })
  }

  // Rebuild the document from the original pieces
  let output = ""
  let cursor = 0
  for (const paragraph of paragraphs) {
    output += xml.slice(cursor, paragraph.start)
    const sourceId = order.get(paragraph.line.id) ?? paragraph.line.id
    const source = byId.get(sourceId)!
    output += newXml.get(sourceId) ?? source.xml
    cursor = paragraph.end
  }
  output += xml.slice(cursor)

  zip.file(DOCUMENT, output)
  const result = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" })
  return { buffer: result, changes, rejected }
}

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
