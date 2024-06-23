import { splitLines } from "@/utils/globalUtil";
import { logger } from "@/utils/JConsole";

export function initEditor(textarea: HTMLInputElement, numbers: HTMLElement) {
    function loadedLineNumbers() {
        logger.debug('run line numbers')
        const lines = calcLines()
        numbers.innerHTML = `<div>${lines.join('</div><div>')}</div>`
    }

    const textareaStyles: CSSStyleDeclaration = window.getComputedStyle(textarea)
    const styleProperties: string[] = [
        'font-family',
        'font-size',
        'font-weight',
        'letter-spacing',
        'line-height',
        'padding-top',
        'padding-bottom'
    ]
    styleProperties.forEach((property: string) => {
        numbers.style[property as never] = textareaStyles[property as never]
    })
    // 借用canvas.measureText方法计算字体宽度
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    context.font = `${textareaStyles.fontSize} ${textareaStyles.fontFamily}`

    function calcSentenceLines(sentence: string, width: number) {
        if (!width) return 0
        const words = sentence.split('')
        let lineCount = 0
        let currentLine = ''
        for (let i = 0; i < words.length; i++) {
            const wordWidth = context.measureText(words[i]).width
            const lineWidth = context.measureText(currentLine).width
            if (lineWidth + wordWidth > width) {
                lineCount++
                currentLine = words[i]
            } else {
                currentLine += words[i]
            }
        }
        if (currentLine.trim() !== '') lineCount++
        return lineCount
    }

    function calcLines(): string[] {
        const lines = splitLines(textarea.value)
        const tpl = parseInt(textareaStyles.paddingLeft, 10)
        const tpr = parseInt(textareaStyles.paddingRight, 10)
        const tcw = textarea.clientWidth - tpl - tpr
        let i = 1
        return lines.reduce((lineNumbers: string[], lineString: string) => {
            const num: number = calcSentenceLines(lineString, tcw)
            lineNumbers.push(String(i++))
            if (num > 1) {
                const l: string[] = Array(num - 1).fill('&nbsp;')
                lineNumbers.push(...l)
            }
            return lineNumbers
        }, [])
    }

    const ro = new ResizeObserver(() => {
        const rect = textarea.getBoundingClientRect()
        numbers.style.height = `${rect.height}px`
        logger.debug('ResizeObserver')
        loadedLineNumbers()
    })
    ro.observe(textarea)
    textarea.addEventListener('scroll', () => {
        numbers.scrollTop = textarea.scrollTop
    })
    return {
        loadedLineNumbers
    }
}
