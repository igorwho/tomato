import { NextResponse } from 'next/server';
import { prisma } from './../../../../prisma/prisma';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, {params}: {params: {chatId: string}}) {
    const messages = await prisma.message.findMany({
        where: {
            chat_id: params.chatId
        },
        orderBy: {
            created_at: "desc"
        },
    });

    return NextResponse.json(messages)
}

export async function POST(request: NextRequest, {params}: {params: {chatId: string}}) {
    const chat = await prisma.chat.findUniqueOrThrow({
        where: {
            id: params.chatId
        }
    })

    const body = await request.json();

    const messageCreated = await prisma.message.create({
        data: {
            content: body.message,
            chat_id: chat.id
        }
    });

    return NextResponse.json(messageCreated);
}

