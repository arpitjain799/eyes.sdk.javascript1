const lineRe = /^([^|]+)\| (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[([^\]]+)\] (.+)$/

type Level = 'INFO'

type TDateISO = `${number}${number}${number}${number}-${number}${number}-${number}${number}T${number}${number}:${number}${number}:${number}${number}.${number}${number}${number}Z`;

type LineMatchArray = [string, string, TDateISO, Level, string]

export interface Line {
    name: string
    tsDiff: number
    tsElapsed: number
    ts: TDateISO
    level: Level
    payload: string
    currObj?: {key: string, str: string}
    data?: Record<string, object>
}

export function parseLog({content}: {content: string}) {
    const lines = content.replace(/(<Buffer .+>)/g, "'$1'").split('\n')
    return lines.reduce((newLines, line, i) => {
        if (i % 1000 === 0) {
            console.log('line', i, `[${newLines.length} new lines]`, line)
        }

        // ***** first, check if the the line matches our structure

        const match = line.match(lineRe)
        const lastLine = newLines[newLines.length - 1]

        try {
            if (match) {
                // ***** if it is, then add it to the list of lines

                const [_, name, ts, level, payload] = match as LineMatchArray
                // console.log(i, payload)
                const tsDiff = lastLine ? new Date(ts).getTime() - new Date(lastLine.ts).getTime() : 0
                const tsElapsed = newLines[0] ? new Date(ts).getTime() - new Date(newLines[0].ts).getTime() : 0
                newLines.push({name, tsDiff, tsElapsed, ts, level, payload})

            } else if (lastLine) {
                // ***** if it's not in the structure, then there are a few options:

                if (lastLine.currObj) {
                    // ***** if there is already an ongoing aggregation of a multi-line object that we need to parse, then:

                    if (line.startsWith('}') || line.startsWith(']')) {
                        // ***** if this line is closing an object, then seal `currObj` (see below), put it in `.data`, and reset it

                        const str = lastLine.currObj.str + line.charAt(0)
                        const obj: object = new Function(`return ${str}`)()
                        lastLine.data = lastLine.data ?? {}
                        lastLine.data[lastLine.currObj.key] = obj
                        delete lastLine.currObj
                        if (line.trim().length > 1) {
                            lastLine.payload += line.slice(1)
                        }
                    } else if (!/^\S/.test(line)) {
                        // ***** this line is part of an ongoing aggregation of an object into `.currObj`

                        lastLine.currObj.str += line.trim()

                    } else {
                        // ***** we are in an ongoing aggregation of an object into `.currObj`, but this line is not part of it - ignore it!
                    }
                } else if (lastLine.payload.match(/(\w+)\s+([{[])$/)) {
                    // ***** we should start aggregating into `.currObj`

                    const [_, key, char] = lastLine.payload.match(/(\w+)\s+([{[])$/) as [string, string, '{' | '[']
                    lastLine.payload = lastLine.payload.replace(/[[{]$/, `%${key}%`)
                    lastLine.currObj = {key, str: char + line.trim()}
                } else if (lastLine.payload.length < 1000) {
                    // ***** there is no current aggregation of multi-line obj, so add this line to the payload of the previous line

                    lastLine.payload += '\n' + line.trim()
                }
            }
        } catch(err) {
            console.error(`error in line ${i+1}`, err)
            throw err   
        }
        return newLines
    }, [] as Line[])
}