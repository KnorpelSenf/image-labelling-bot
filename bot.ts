import fs from 'fs'
import https from 'https'
import { Context, session, Telegraf } from 'telegraf'
import tmp from 'tmp'
import { detectLabels } from './label-detection'

interface BotContext extends Context {
    session: SessionData
}

interface SessionData {
    messages: ImageMessage[]
}

interface ImageMessage {
    message_id: number
    file_id: string
    image_labels: string[]
}

export default (token: string): Telegraf<BotContext> => {
    const bot = new Telegraf<BotContext>(token)

    bot.use(session())
    bot.use((ctx, next) => {
        ctx.session.messages ??= []
        next()
    })

    bot.command(['start', 'help'], ({ reply }) =>
        reply('Send me a picture and I will label it for you.')
    )

    bot.on('photo', ctx => handlePhoto(ctx))

    return bot
}

async function handlePhoto(ctx: BotContext): Promise<void> {
    if (ctx.message?.photo !== undefined) {
        // get file info
        const pic = ctx.message.photo[ctx.message.photo.length - 1]
        const fileId = pic.file_id
        const url = await ctx.telegram.getFileLink(fileId)
        // download image
        const file = tmp.fileSync({ prefix: fileId })
        await download(url, file.name)
        // run label detection
        const labels = await detectLabels(file.name)
        // save labels in session
        ctx.session.messages.push({
            message_id: ctx.message.message_id,
            file_id: fileId,
            image_labels: labels,
        })
        // send message
        const hashtags = labels.map(l => '#' + l.replace(/\s/g, '_')).join('\n')
        await ctx.reply('This is in your image:\n' + hashtags, {
            reply_to_message_id: ctx.message.message_id,
        })
    }
}

async function download(url: string, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(path)
        https.get(url, res => {
            res.on('error', e => reject(e))
            res.on('end', () => resolve())
            res.pipe(file)
        })
    })
}
