import type { Request, Response } from 'express'
import { Update } from 'typegram'
import bot from './bot'

const botToken = process.env.BOT_TOKEN ?? ''

if (!botToken) {
    throw new Error('Env var BOT_TOKEN missing!')
}

const telegram = bot(botToken)

export async function updateHandler(
    req: Request,
    res: Response
): Promise<void> {
    const update: Update = req.body
    await telegram.handleUpdate(update)
    res.end()
}
