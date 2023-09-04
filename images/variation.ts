import { toFile, OpenAI } from 'openai'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { OpenAIBase, ImageProps } from './base'

/**
 * Generate image variations using the OpenAI API and DALLE. Saves the images to the outputDir.
 * - can pass in either a url or a path to the image. If a url is passed in, the image will be downloaded and saved to the outputDir.
 * @param images - an array of image objects
 * @param outputDir - the directory to save the images to. Default is ./images
 * @param saveCropped - whether to save the cropped image to outputDir/cropped. Default is true
 * @param size - the size of the image to generate. Default is 512x512
 */
export class ImageVariation extends OpenAIBase {
    /** The image or images you want to make variations for. Can also be an array of many images. */
    images: ImageProps | ImageProps[]
    /** Whether to save the cropped image to outputDir/cropped. Default is true */
    saveCropped: boolean
    /** The size of the image to generate. Default is 512x512*/
    size: '256x256' | '512x512' | '1024x1024'

    constructor(
        images: ImageProps | ImageProps[],
        outputDir: string,
        saveCropped: boolean = true,
        size: '256x256' | '512x512' | '1024x1024' = '512x512'
    ) {
        super(outputDir)
        this.images = images
        this.saveCropped = saveCropped
        this.size = size
    }

    async generate() {
        this.checkOutputDir()
        this.checkApiKey()
        // create image stream from products.url
        if (!Array.isArray(this.images)) {
            this.images = [this.images]
        }
        for await (const image of this.images) {
            await fs.mkdir(this.outputDir, { recursive: true })
            image.fileName = this.formatFileName(image.fileName)
            let buffer: Buffer
            if ('url' in image) {
                buffer = await this.downloadImage(image.url)
            } else {
                const absPath = path.resolve(image.path)
                buffer = await fs.readFile(absPath)
            }
            const croppedBuffer = await this.cropToSquare(
                buffer,
                image.fileName
            )

            await this.generateVariation(croppedBuffer, image.fileName)
        }
    }

    private async cropToSquare(image: Buffer, fileName: string) {
        const hw = parseInt(this.size.split('x')[0])
        const croppedImg = sharp(image)
            .resize({ fit: 'cover', width: hw, height: hw })
            .toFormat('png')

        if (this.saveCropped) {
            const croppedPath = `${this.outputDir}/cropped/${fileName}.jpg`
            const file = await croppedImg.toFile(croppedPath)
            console.log('cropped file to ', file.height, 'x', file.width)
        }
        const { data } = await croppedImg.toBuffer({ resolveWithObject: true })
        return data
    }

    /** Download image from external url */
    private async downloadImage(url: string) {
        const res = await fetch(url)
        const arrayBuffer = await res.arrayBuffer()
        console.log('downloaded image: ', arrayBuffer.byteLength)
        return Buffer.from(arrayBuffer)
    }

    /** Generate variation using the openAI api and DALLE */
    private async generateVariation(buffer: Buffer, fileName: string) {
        console.log('generating image variation for: ', fileName)
        const res = await this.openAI.images.createVariation({
            image: await toFile(buffer, `${fileName}.png`),
            n: 1,
            size: '512x512',
            response_format: 'b64_json'
        })
        const base64 = res.data[0].b64_json
        if (!base64) {
            throw new Error('No base64 data')
        }
        const variationFile = await this.saveImage(base64, fileName)
        console.log('generated and saved image: ', variationFile)
    }
}
