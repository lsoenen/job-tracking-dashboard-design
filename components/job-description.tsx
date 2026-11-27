/** Renders plain-text job descriptions: blank lines split paragraphs, "• " lines become bullets */
export function JobDescription({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/)

  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((line) => line.trim())
        const bullets = lines.filter((line) => line.startsWith("• "))
        const intro = lines.filter((line) => !line.startsWith("• "))

        return (
          <div key={blockIndex} className="flex flex-col gap-2">
            {intro.map((line, lineIndex) => {
              const isHeading = line.length < 70 && !/[.!?]$/.test(line) && (bullets.length > 0 || lines.length === 1)
              return isHeading ? (
                <h4 key={lineIndex} className="font-medium text-foreground">{line}</h4>
              ) : (
                <p key={lineIndex}>{line}</p>
              )
            })}
            {bullets.length > 0 && (
              <ul className="flex list-disc flex-col gap-1.5 pl-5">
                {bullets.map((line, lineIndex) => <li key={lineIndex}>{line.slice(2)}</li>)}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
