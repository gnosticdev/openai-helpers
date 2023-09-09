import { OpenAI } from 'openai'
import fs from 'node:fs/promises'
import path from 'node:path'

interface DiskImageProps {
    /** the absolute path to the image on disk  */
    path: string
    /** the outputted image file name */
    fileName: string
}

interface UrlImageProps {
    /** the downloadable image url */
    url: string
    /** the outputted image file name */
    fileName: string
}

export type ImageProps = DiskImageProps | UrlImageProps

/**
 * Base class for image generation and variation
 * @param outputDir - the directory to save the images to. Default is ./images
 *
 */
export class OpenAIBase {
    /** The directory to save the images to. */
    outputDir: string
    /** main openAI class with encapsulated apikey*/
    openAI: OpenAI

    constructor(outputDir: string) {
        this.outputDir = outputDir
        this.openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }

    formatFileName(fileName: string) {
        return fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    }
    /** check that the output dir is absolute */
    checkOutputDir() {
        if (!path.isAbsolute(this.outputDir)) {
            throw new Error('outputDir must be an absolute path')
        }
    }
    /** check that the api key is available in the environment */
    checkApiKey() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error(
                `you must add OPENAI_API_KEY to your environment.
                session: type OPENAI_API_KEY=<your api key here> into your terminal.
                shell config: add or to your ~/.zshrc or ~/.bashrc file`
            )
        }
    }

    generateFilePath(fileName: string) {
        fileName = this.formatFileName(fileName) + '.jpg'
        return `${this.outputDir}/${fileName}.jpg`
    }

    /** Convert the OpenAI base_64 json response into an image and save to file system */
    async saveImage(base64: string, fileName: string) {
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
        const dataBuffer = Buffer.from(base64Data, 'base64')
        const filePath = `${this.outputDir}/${fileName}.jpg`
        await fs.writeFile(filePath, dataBuffer)
        console.log('saved image to: ', filePath)
        return filePath
    }
}
