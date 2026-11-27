// Write a new cover letter into the user's own sample letter (.docx), keeping its design:
// the letterhead, sign-off and signature stay untouched, the date, recipient and greeting
// are updated in place, and the body paragraphs are replaced with new ones that copy the
// formatting of the sample's body text.
import JSZip from "jszip"

import { encodeXml, findParagraphs, parseRuns, textWithTabs } from "@/lib/resume-docx"

export type LetterRole = "header" | "date" | "recipient" | "salutation" | "body" | "closing" | "signature"

export type LetterLine = { id: string; role: LetterRole; text: string }

export type ParsedLetter = {
  lines: LetterLine[]
  /** The sample's body text, paragraph by paragraph: the voice to follow */
  bodyParagraphs: string[]
  bodyWords: number
}

type Block = { start: number; end: number; xml: string; text: string }

const DOCUMENT = "word/document.xml"
const salutationPattern = /^(dear|hi|hello|greetings|to whom)\b/i
const closingPattern =
  /^(sincerely|best|best regards|kind regards|warm regards|warmest regards|regards|thank you|thanks|respectfully|cheers|yours truly|yours sincerely|all the best|with gratitude|with appreciation)[\s,!.]*$/i
const datePattern =
  /^(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?,?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})$/i

const words = (text: string) => text.split(/\s+/).filter(Boolean).length

async function load(buffer: ArrayBuffer | Uint8Array) {
  const zip = await JSZip.loadAsync(buffer)
  const file = zip.file(DOCUMENT)
  if (!file) throw new Error("This doesn't look like a Word document.")
  return { zip, xml: await file.async("string") }
}

/** Every paragraph in order, including empty ones (which often space out a letter's body) */
function blocksOf(xml: string): Block[] {
  return findParagraphs(xml).map(({ start, end }) => {
    const paragraphXml = xml.slice(start, end)
    return { start, end, xml: paragraphXml, text: textWithTabs(paragraphXml).replace(/\t+/g, " ").trim() }
  })
}

type Structure = {
  blocks: Block[]
  roles: Map<number, LetterRole>
  bodyStart: number
  bodyEnd: number
}

function analyze(xml: string): Structure {
  const blocks = blocksOf(xml)
  const filled = blocks.map((block, index) => ({ block, index })).filter(({ block }) => block.text)
  if (filled.length === 0) throw new Error("No text was found in the sample cover letter.")

  const salutation = filled.find(({ block }) => salutationPattern.test(block.text) && block.text.length <= 80)
  const afterSalutation = salutation ? filled.filter(({ index }) => index > salutation.index) : filled
  const closing = afterSalutation.find(({ block }) => block.text.length <= 40 && closingPattern.test(block.text))

  // Body: between the greeting and the sign-off. Without those, the run of long paragraphs.
  let bodyIndexes = filled
    .filter(({ index }) => (!salutation || index > salutation.index) && (!closing || index < closing.index))
    .map(({ index }) => index)
  if (!salutation || !closing) {
    const long = filled.filter(({ block }) => block.text.length >= 120).map(({ index }) => index)
    if (long.length) bodyIndexes = filled.map(({ index }) => index).filter((index) => index >= long[0] && index <= long[long.length - 1])
  }
  if (bodyIndexes.length === 0) {
    throw new Error("Couldn't find the body of the sample letter. Make sure it has a greeting (\"Dear…\") and a sign-off (\"Sincerely,\").")
  }

  const roles = new Map<number, LetterRole>()
  const bodyStart = bodyIndexes[0]
  const bodyEnd = bodyIndexes[bodyIndexes.length - 1]
  const beforeBody = filled.filter(({ index }) => index < bodyStart && index !== salutation?.index)
  const date = beforeBody.find(({ block }) => datePattern.test(block.text))

  for (const { index, block } of filled) {
    if (index >= bodyStart && index <= bodyEnd) roles.set(index, "body")
    else if (index === salutation?.index) roles.set(index, "salutation")
    else if (index === date?.index) roles.set(index, "date")
    else if (date && index > date.index && index < bodyStart && !/@|\d{3}[-.\s]\d{3}[-.\s]\d{4}/.test(block.text)) roles.set(index, "recipient")
    else if (index < bodyStart) roles.set(index, "header")
    else if (closing && index === closing.index) roles.set(index, "closing")
    else roles.set(index, "signature")
  }

  // The body must be plain paragraphs side by side (not split across table cells or sections)
  const region = xml.slice(blocks[bodyStart].start, blocks[bodyEnd].end)
  if (/<w:tbl\b|<\/w:tc>|<w:sectPr/.test(region)) {
    throw new Error("The sample letter's body is inside a table or spans sections, which isn't supported yet. Try a simpler version of the letter.")
  }

  return { blocks, roles, bodyStart, bodyEnd }
}

/** Read a sample letter into labelled lines */
export async function parseCoverLetter(buffer: ArrayBuffer | Uint8Array): Promise<ParsedLetter> {
  const { xml } = await load(buffer)
  const { blocks, roles } = analyze(xml)
  const lines: LetterLine[] = []
  blocks.forEach((block, index) => {
    const role = roles.get(index)
    if (role && block.text) lines.push({ id: `l${index}`, role, text: block.text })
  })
  const bodyParagraphs = lines.filter((line) => line.role === "body").map((line) => line.text)
  return { lines, bodyParagraphs, bodyWords: words(bodyParagraphs.join(" ")) }
}

/** Put new text into a paragraph's existing runs: the first text gets it all, the rest are emptied */
function replaceParagraphText(paragraphXml: string, text: string) {
  const runs = parseRuns(paragraphXml)
  const texts = runs.flatMap((run) => run.texts)
  if (texts.length === 0) return paragraphXml
  let updated = paragraphXml
  for (const [index, item] of [...texts.entries()].reverse()) {
    const value = index === 0 ? `<w:t xml:space="preserve">${encodeXml(text)}</w:t>` : ""
    updated = updated.slice(0, item.start) + value + updated.slice(item.end)
  }
  return updated
}

export type LetterContent = {
  date?: string
  salutation?: string
  recipient?: { id: string; text: string }[]
  paragraphs: string[]
}

/** Write a new letter into the sample's design, returning a new .docx */
export async function buildCoverLetter(buffer: ArrayBuffer | Uint8Array, content: LetterContent): Promise<Uint8Array> {
  const { zip, xml } = await load(buffer)
  const { blocks, roles, bodyStart, bodyEnd } = analyze(xml)

  // Formatting to copy for each new body paragraph: the sample's longest body paragraph
  const bodyBlocks = blocks.slice(bodyStart, bodyEnd + 1)
  const template = [...bodyBlocks].filter((block) => block.text).sort((left, right) => right.text.length - left.text.length)[0]
  const pPr = template.xml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)?.[0] ?? ""
  const mainRun = parseRuns(template.xml)
    .map((run) => ({ run, length: run.texts.reduce((total, item) => total + item.value.length, 0) }))
    .sort((left, right) => right.length - left.length)[0]?.run
  const rPr = mainRun?.rPr ?? ""
  // If the sample separates paragraphs with an empty line, do the same
  const spacer = bodyBlocks.find((block, index) => !block.text && index > 0 && index < bodyBlocks.length - 1)?.xml ?? ""

  const newBody = content.paragraphs
    .map((paragraph) => `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${encodeXml(paragraph.trim())}</w:t></w:r></w:p>`)
    .join(spacer)

  const recipientById = new Map((content.recipient ?? []).map((line) => [line.id, line.text]))

  let output = ""
  let cursor = 0
  blocks.forEach((block, index) => {
    if (index > bodyStart && index <= bodyEnd) return // replaced together with the first body paragraph
    output += xml.slice(cursor, block.start)
    const role = roles.get(index)
    if (index === bodyStart) {
      output += newBody
      cursor = blocks[bodyEnd].end
      return
    }
    let next = block.xml
    if (role === "date" && content.date) next = replaceParagraphText(block.xml, content.date)
    else if (role === "salutation" && content.salutation) next = replaceParagraphText(block.xml, content.salutation)
    else if (role === "recipient" && recipientById.has(`l${index}`)) next = replaceParagraphText(block.xml, recipientById.get(`l${index}`)!)
    output += next
    cursor = block.end
  })
  output += xml.slice(cursor)

  zip.file(DOCUMENT, output)
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" })
}

export function countWords(text: string) {
  return words(text)
}
