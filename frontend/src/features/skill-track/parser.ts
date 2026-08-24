import mammoth from 'mammoth'

export interface ParsedQuestion {
  question_text: string
  options: string[]
  correct_answer: string
  points: number
}

// ─── 1. Plain Text / Direct Message Parser ───────────────────────────────
export function parsePlainText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  
  // Split the text into blocks by lines starting with numbers (e.g. "1.", "2)") using positive lookahead
  const blocks = text.split(/(?=^\s*\d+[\s.)-]+\s*)/gm)
  
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length < 2) continue

    let questionText = ''
    const options: string[] = []
    let correctAnswer = ''
    let points = 1
    let optionsStarted = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Check if it's correct answer line (emoji-tolerant), e.g. "✅ Answer: B", "Correct: B", "Answer: A"
      if (/^(?:[^\w]*)(correct\s*answer|correct|answer|ans)\s*[:=-]\s*/i.test(line)) {
        const match = line.match(/^(?:[^\w]*)(correct\s*answer|correct|answer|ans)\s*[:=-]\s*(.*)$/i)
        if (match && match[2]) {
          correctAnswer = match[2].trim()
        }
        continue
      }

      // Check if it's points line (emoji-tolerant), e.g. "Points: 5"
      if (/^(?:[^\w]*)(points|marks|point)\s*[:=-]\s*/i.test(line)) {
        const match = line.match(/^(?:[^\w]*)(points|marks|point)\s*[:=-]\s*(\d+)$/i)
        if (match && match[2]) {
          points = parseInt(match[2], 10) || 1
        }
        continue
      }

      // Check if it is an option line, e.g. "A) option text", "a. option text"
      const optionPrefixMatch = line.match(/^([A-Z])[\s.)\]-]+\s*(.*)$/i)
      if (optionPrefixMatch) {
        optionsStarted = true
        options.push(optionPrefixMatch[2].trim())
        // Map correct answer letter to correct answer text if set previously
        const prefixLetter = optionPrefixMatch[1].toUpperCase()
        if (correctAnswer && (correctAnswer.toUpperCase() === prefixLetter || correctAnswer.toUpperCase() === `${prefixLetter})` || correctAnswer.toUpperCase() === `(${prefixLetter})`)) {
          correctAnswer = optionPrefixMatch[2].trim()
        }
      } else {
        if (optionsStarted) {
          options.push(line)
        } else {
          if (questionText) {
            questionText += ' ' + line
          } else {
            questionText = line
          }
        }
      }
    }

    // Clean up question text and strip leading numbering prefixes like "1. ", "Q2: "
    questionText = questionText.replace(/^[\d+Q\s.:-]+\s*/i, '').trim()

    // Clean up correct answer if it starts with a letter prefix (e.g. "B) Building User Interfaces" or "B")
    if (correctAnswer && options.length > 0) {
      const cleanCorrect = correctAnswer.trim()
      const ansPrefixMatch = cleanCorrect.match(/^([A-Z])(?:[\s.)\]-]+\s*(.*))?$/i)
      if (ansPrefixMatch) {
        const letter = ansPrefixMatch[1].toUpperCase()
        const letterIdx = letter.charCodeAt(0) - 65 // A=0, B=1, ...
        if (letterIdx >= 0 && letterIdx < options.length) {
          correctAnswer = options[letterIdx]
        }
      }
    }

    if (questionText && options.length >= 2) {
      if (!correctAnswer || !options.includes(correctAnswer)) {
        correctAnswer = options[0]
      }
      questions.push({
        question_text: questionText,
        options,
        correct_answer: correctAnswer,
        points
      })
    }
  }

  return questions
}

// ─── 2. CSV Parser ───────────────────────────────────────────────────────
export function parseCSVText(csvText: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  const lines = csvText.split(/\r?\n/)
  if (lines.length < 2) return []

  // Helper to split CSV row handling quotes
  const parseCSVRow = (rowText: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < rowText.length; i++) {
      const char = rowText[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result.map(val => val.replace(/^"|"$/g, '')) // remove wrapping quotes
  }

  const header = parseCSVRow(lines[0])
  const colIndex = {
    question: header.findIndex(h => /question/i.test(h)),
    options: header.map((h, idx) => /option/i.test(h) ? idx : -1).filter(idx => idx !== -1),
    correct: header.findIndex(h => /(correct|answer)/i.test(h)),
    points: header.findIndex(h => /(points|marks)/i.test(h))
  }

  // Fallback map if headers aren't explicitly matched
  if (colIndex.question === -1) colIndex.question = 0
  if (colIndex.options.length === 0) colIndex.options = [1, 2, 3, 4]
  if (colIndex.correct === -1) colIndex.correct = colIndex.options[colIndex.options.length - 1] + 1

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const columns = parseCSVRow(line)
    if (columns.length <= Math.max(colIndex.question, colIndex.correct)) continue

    const questionText = columns[colIndex.question]
    const options = colIndex.options
      .map(idx => columns[idx])
      .filter(val => val !== undefined && val !== '')

    let correctAnswer = columns[colIndex.correct] || ''
    let points = 1
    if (colIndex.points !== -1 && columns[colIndex.points]) {
      points = parseInt(columns[colIndex.points], 10) || 1
    }

    // Check if correct answer is a letter pointing to Option index
    if (correctAnswer.trim().length === 1 && options.length > 0) {
      const letterIdx = correctAnswer.trim().toUpperCase().charCodeAt(0) - 65
      if (letterIdx >= 0 && letterIdx < options.length) {
        correctAnswer = options[letterIdx]
      }
    }

    if (questionText && options.length >= 2) {
      if (!correctAnswer || !options.includes(correctAnswer)) {
        correctAnswer = options[0]
      }
      questions.push({
        question_text: questionText,
        options,
        correct_answer: correctAnswer,
        points
      })
    }
  }

  return questions
}

// ─── 3. Word (.docx) Parser ──────────────────────────────────────────────
export async function parseDocxFile(file: File): Promise<ParsedQuestion[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer
        const result = await mammoth.extractRawText({ arrayBuffer })
        const text = result.value || ''
        const parsed = parsePlainText(text)
        resolve(parsed)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = (err) => reject(err)
    reader.readAsArrayBuffer(file)
  })
}
