import { ChatServiceClientFactory } from './../../../../../grpc/chat-service-client';
import { prisma } from './../../../../prisma/prisma';
import { NextRequest } from 'next/server';

export async function GET(
    request: NextRequest,
    {params}: {params: {messageId: string}}) {
    const message = await prisma.message.findFirstOrThrow({
        where: {
            id: params.messageId,
        },
        include: {
            chat: true,
        }
    });

    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();

    if (message.has_answered) {
        setTimeout(async () => {
            writeStream(writer, "error", "Message already answered");
            await writer.close();
        }, 100);

        return response(transformStream, 403);
    }

    if (message.is_from_bot) {
        setTimeout(async () => {
            writeStream(writer, "error", "Message from bot");
            await writer.close();
        }, 100);

        return response(transformStream, 403);
    }

    const chatService = ChatServiceClientFactory.create();
    const stream = chatService.chatStream({
        message: message.content, 
        user_id: "1", 
        chat_id: message.chat.remote_chat_id!
    });

    let messageReceived: {content: string, chatId: string} | null = null;

    stream.on('data', async (data) => {
        messageReceived = data;
        await writeStream(writer, "message", data);
    });

    stream.on('error', async (err) => {
        writeStream(writer, "error", err);
        await writer.close();
    });

    stream.on('end', async () => {
        if (!messageReceived) {
            writeStream(writer, "error", "No message received");
            await writer.close();
            return;
        }

        const [newMessage] = await prisma.$transaction([
            prisma.message.create({
                data: {
                    content: messageReceived.content,
                    chat_id: message.chat_id,
                    has_answered: true,
                    is_from_bot: true,
                }
            }),
    
            prisma.chat.update({
                where: {
                    id: message.chat_id,
                },
                data: {
                    remote_chat_id: messageReceived.chatId,
                }
            }),
    
            prisma.message.update({
                where: {
                    id: message.id,
                },
                data: {
                    has_answered: true,
                }
            })
        ]);

        writeStream(writer, "end", newMessage);
        await writer.close();
    });

    return response(transformStream);
}

function response(transformStream: TransformStream, status=200) {
    return new Response(transformStream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
        status,
    });
}

type Event = "message" | "error" | "end";

async function writeStream(writer: WritableStreamDefaultWriter, event: Event, data: any) {
    const encoder = new TextEncoder();

    writer.write(encoder.encode(`event: ${event}\n`));
    writer.write(encoder.encode(`id: ${new Date().getTime()}\n`));

    const streamData = typeof data === 'string' ? data : JSON.stringify(data);
    writer.write(encoder.encode(`data: ${streamData}\n\n`));
}