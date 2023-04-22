import { chatClient } from './client';
import { data } from 'autoprefixer';
import { ChatServiceClient as GrpcChatServiceClient } from './rpc/pb/ChatService';
import { Metadata } from '@grpc/grpc-js';

export class ChatServiceClient {
    constructor(private chatClient: GrpcChatServiceClient) {}
    private authorization = "123456";

    chatStream(
        data: {
            chat_id?: string;
            user_id: string;
            message: string;
        }
    ) {
        const metadata = new Metadata();
        metadata.set('authorization', this.authorization)
        const stream = this.chatClient.chatStream({
            chatId: data.chat_id,
            userId: data.user_id,
            userMessage: data.message,
        }, 
        metadata);

        stream.on('data', (data) => {
            console.log('Received', data);
        });

        stream.on('error', (err) => {
            console.error('Error', err);
        });

        stream.on('end', () => {
            console.log('End');
        });

        return stream
    }
}

export class ChatServiceClientFactory {
    static create() {
        return new ChatServiceClient(chatClient);
    }
}