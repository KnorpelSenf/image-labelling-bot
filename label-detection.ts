import { ImageAnnotatorClient } from '@google-cloud/vision'

export async function detectLabels(path: string): Promise<string[]> {
    // Creates a client
    const client = new ImageAnnotatorClient()
    // Performs label detection on the image file
    const [result] = await client.labelDetection(path)
    const labels = result.labelAnnotations
    return truthy(labels?.map(l => l.description))
}

function truthy<E>(arr?: Array<E | null | undefined>): E[] {
    const res: E[] = []
    if (!arr || !Array.isArray(arr)) return res
    for (const x of arr) if (x) res.push(x)
    return res
}
