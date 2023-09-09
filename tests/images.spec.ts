import { ImageProps } from '../src/images/base'
import { ImageVariation } from '../src/images/variation'
import { ImageGeneration } from '../src/images/generation'
import path from 'node:path'
import fs from 'node:fs'

const outputDir = path.resolve('tests/out')

/** ------ VARIATIONS ------ */
// const { default: imageData } = await import('./test-images.json')
// const images: ImageProps[] = imageData.map((img) => {
//     return {
//         fileName: img.fileName,
//         path: path.resolve(img.path)
//     }
// })
// const Variations = new ImageVariation(images, outputDir, false, '256x256')

/** ------- GENERATIONS ------ */
const generate = new ImageGeneration({
    fileName: 'test',
    outputDir,
    OpenAI: {
        prompt: 'resiendial landscape with quaint house, lush garden, with visible mulch and a stone walkway',
        size: '512x512',
        n: 2
    }
})

const files = await generate.generate()
console.log('generated files: ', files)
