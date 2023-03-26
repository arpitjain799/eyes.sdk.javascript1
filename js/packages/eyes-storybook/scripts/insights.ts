import {inspect} from 'util'
import {readFileSync} from 'fs'
import {type Line} from './parse-log'

const filepath = process.argv[2]
console.log('processing', filepath)

const lines: Line[] = JSON.parse(readFileSync(filepath).toString())

console.log(lines.length)


const REGEX = {
    gotXStories: /got \d+ stories: (.+)$/,
    gettingData: /^getting data from story (.+)$/,
    doneGettingData: /^done getting data from story (.+)$/,
    initialOpenEyes: /^Command "openEyes" is called with  settings/,
    openEyes: /Command "openEyes" is called with settings/,
    openEyesRequestStart: /Request "openEyes" called with settings/,
    openEyesRequestEnd: /Request "openEyes" finished successfully with body/,
    checkAndClose: /Command "checkAndClose" is called with settings/,
    checkAndCloseRequestStart: /Request "checkAndClose" called for target/,
    checkAndCloseRequestEnd: /Request "checkAndClose" finished successfully with body/,
    renderStart: /Request "startRenders" called for requests/,
    renderEnd: /Request "checkRenderResults" finished successfully with body/,
}

interface Story {
    id: string,
    tests: Record<string, StoryTest>,
    start?: number,
    doneGettingData?: number,
    initialOpenEyes?: number,
    initialCheckAndClose?: number,
}

interface StoryTest {
    rawEnvironment?: object,
    start: number,
    openEyesRequestStart?: number,
    openEyesRequestEnd?: number,
    checkAndClose?: number,
    renderId?: string,
    sessionId?: string,
    checkAndCloseRequestStart?: number,
    checkAndCloseRequestEnd?: number,
    renderStart?: number,
    renderEnd?: number,
}

interface Settings {
    testName: string,
    renderers: object[],
    renderId: string,
    environment: {
        rawEnvironment: object,
        rendererInfo: {
            renderer: object
        }
    }
}

interface OpenEyesBody {
    userTestId: string,
    rendererInfo: {
        renderer: object,
    },
    sessionId: string,
}

interface CheckAndCloseBody {
    name: string,
    id: string,
}

interface RenderRequest {
    settings: {
        renderers: object[],
        url: string
    }
}

interface RenderResponse {
    renderId: string,
    status: 'rendering' | 'rendered' | 'error',
    error?: string
}


const stories : Record<string, Story> = {}
const times = {openEyes: [], checkAndClose: [], render: []}


const renderEnds: Record<string, Line> = {}
const renderers: Record<string, object> = {}

for (const line of lines) {
    let match

    if (match = line.payload.match(REGEX.gotXStories)) {
        const allStories = JSON.parse(match[1])
        for (const story of allStories) {
            stories[getStoryTitle(story)] = {id: story.id, tests: {}}
        }
    } else if (match = line.payload.match(REGEX.gettingData)) {
        const [_, storyTitle] = match
        stories[storyTitle].start = line.tsElapsed
    } else if (match = line.payload.match(REGEX.doneGettingData)) {
        const [_, storyTitle] = match
        const story = stories[storyTitle]
        story.doneGettingData = line.tsElapsed - story.start
    } else if (match = line.payload.match(REGEX.initialOpenEyes)) {
        const storyTitle = (line.data!.settings as {testName: string}).testName
        const story = stories[storyTitle]
        story.initialOpenEyes = line.tsElapsed - story.start
    } else if (match = line.payload.match(REGEX.checkAndClose)) {
        const storyTitle = getStoryTitle({storyUrl: (line.data!.settings as {url: string}).url})
        const story = stories[storyTitle]
        if ('renderId' in line.data!.settings) {
            const settings: Settings = line.data!.settings as any
            const renderId = settings.renderId
            const renderer = renderers[renderId]
            const test = story.tests[JSON.stringify(renderer)]
            test.checkAndClose = line.tsElapsed - test.start
            test.renderId = renderId
            test.renderEnd = renderEnds[test.renderId].tsElapsed - test.start
            times.render.push(test.renderEnd - test.openEyesRequestEnd)
        } else {
            story.initialCheckAndClose = line.tsElapsed - story.start
        }
    } else if (match = line.payload.match(REGEX.openEyes)) {
        const settings: Settings = line.data!.settings as any
        const storyTitle = settings.testName
        const story = stories[storyTitle]
        story.tests[JSON.stringify(settings.environment.rendererInfo.renderer)] = {start: line.tsElapsed}
    } else if (match = line.payload.match(REGEX.openEyesRequestStart)) {
        const settings: Settings = line.data!.settings as any
        const storyTitle = settings.testName
        const story = stories[storyTitle]
        const test = story.tests[JSON.stringify(settings.environment.rendererInfo.renderer)]
        test.openEyesRequestStart = line.tsElapsed - test.start
        // test.rawEnvironment = settings.environment.rawEnvironment
    } else if (match = line.payload.match(REGEX.openEyesRequestEnd)) {
        const body: OpenEyesBody = line.data!.body as any
        const [storyTitle] = body.userTestId.split('--')
        const renderer = body.rendererInfo.renderer
        const story = stories[storyTitle]
        const test = story.tests[JSON.stringify(renderer)]
        test.openEyesRequestEnd = line.tsElapsed - test.start
        test.sessionId = body.sessionId
        times.openEyes.push(test.openEyesRequestEnd)
        // console.log(storyTitle, JSON.stringify(renderer), test.openEyesRequestEnd)
    } else if (match = line.payload.match(REGEX.checkAndCloseRequestStart)) {
        const storyTitle = getStoryTitle({storyUrl: (line.data!.settings as {url: string}).url})
        const story = stories[storyTitle]
        const settings: Settings = line.data!.settings as any
        const [renderer] = settings.renderers
        const test = story.tests[JSON.stringify(renderer)]
        test.checkAndCloseRequestStart = line.tsElapsed - test.start
    } else if (match = line.payload.match(REGEX.checkAndCloseRequestEnd)) {
        const body: CheckAndCloseBody = line.data!.body as any
        const storyTitle = body.name
        const sessionId = body.id
        const story = stories[storyTitle]
        const test = Object.values(story.tests).find(t => t.sessionId === sessionId)
        test.checkAndCloseRequestEnd = line.tsElapsed - test.start
        console.log('###', test.renderId, test.checkAndCloseRequestEnd, test.renderEnd)
        times.checkAndClose.push(test.checkAndCloseRequestEnd - test.renderEnd)
    } else if (match = line.payload.match(REGEX.renderStart)) {
        const requests: RenderRequest[] = line.data!.requests as any
        for (const request of requests) {
            const storyTitle = getStoryTitle({storyUrl: request.settings.url})
            const [renderer] = request.settings.renderers
            const story = stories[storyTitle]
            const test = story.tests[JSON.stringify(renderer)]
            test.renderStart = line.tsElapsed - test.start
        }
    } else if (match = line.payload.match(REGEX.renderEnd)) {
        const responses: RenderResponse[] = line.data!.body as any
        for (const response of responses) {
            if (response.status === 'rendered') {
                renderEnds[response.renderId] = line
            }
        }
    }
}

// console.log(inspect(stories, {colors: true, depth: 10}))

console.log(times)

console.log('openEyes', digest(times.openEyes))
console.log('checkAndClose', digest(times.checkAndClose))
console.log('render', digest(times.render))

function getStoryUrl(storyTitle) {
    const [kind, name] = storyTitle.split(':').map(s => s.trim())
    return `selectedKind=${encodeURIComponent(kind)}&selectedStory=${encodeURIComponent(name)}`
}

function getStoryTitle({storyUrl, kind, name}: {storyUrl?: string, kind?: string, name?: string}) {
    if (storyUrl) {
        const url = new URL(storyUrl)
        kind = decodeURIComponent(url.searchParams.get('selectedKind')!)
        name = decodeURIComponent(url.searchParams.get('selectedStory')!)
    }
    return `${kind}: ${name}`
}



function digest(numbers) {
    const sum = numbers.reduce((sum, x) => sum + x, 0)
    const len = numbers.length
    const avg = sum / len
    const half = numbers[Math.floor(len / 2)]
    const max = Math.max(...numbers)
    const min = Math.min(...numbers)
    return {len, avg, half, max, min}
}