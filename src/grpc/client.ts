import { ProtoGrpcType } from './rpc/chat';
import * as protoLoader from '@grpc/proto-loader';
import * as grpc from '@grpc/grpc-js';
import path from 'path';

const packageDefinition = protoLoader.loadSync(
    path.resolve(process.cwd(), 'proto', 'chat.proto'),
);

const proto = grpc.loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType;

export const chatClient = new proto.pb.ChatService(
    'localhost:50052',
    grpc.credentials.createInsecure(),
)

