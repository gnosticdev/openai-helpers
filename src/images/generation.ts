import { OpenAI } from 'openai'
import { OpenAIBase } from './base'

type ImageGenParams = Omit<OpenAI.ImageGenerateParams, 'response_format'>
interface ImageGenProps {
    outputDir: string
    fileName: string
    OpenAI: ImageGenParams
}

export class ImageGeneration extends OpenAIBase {
    public params
    constructor(params: ImageGenProps) {
        super(params.outputDir)
        this.params = params
    }

    async generate() {
        let fileNames: string[] = []
        try {
            console.log('generating images...')
            const res = await this.openAI.images.generate({
                response_format: 'b64_json',
                ...this.params.OpenAI
            })

            if (!this.params.OpenAI.n || this.params.OpenAI.n === 1) {
                const base64 = res.data.at(0)?.b64_json
                if (!base64) {
                    throw new Error('No base64 data found in response')
                }
                const file = await this.saveImage(base64, this.params.fileName)
                fileNames.push(file)
            } else {
                res.data.map(async (d, i) => {
                    const base64 = d.b64_json
                    if (!base64) {
                        throw new Error('No base64 data found in response')
                    }
                    const file = await this.saveImage(
                        base64,
                        `${this.params.fileName}-${i}`
                    )
                    fileNames.push(file)
                })
            }
        } catch (error) {
            console.error(error)
        }

        return fileNames
    }
}
