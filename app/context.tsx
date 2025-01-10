import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import type { Socket } from "socket.io-client";

type SocketProviderProps = {
  socket: Socket | undefined;
  children: ReactNode;
};

const SocketContext = createContext<Socket | undefined>(undefined);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ socket, children }: SocketProviderProps) {
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

type ChatProviderProps = {
  chat: {
    chat_id: string;
    user_full_name: string;
  }[];
  children: ReactNode;
};

const ChatContext = createContext<
  | {
      chat_id: string;
      user_full_name: string;
    }[]
  | []
>([]);

export function useChat() {
  return useContext(ChatContext);
}

export function ChatProvider({ chat, children }: ChatProviderProps) {
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export type Message = {
  target: string;
  from: string;
  body_message: string;
  date_time: number;
};

type MessageProviderProps = {
  message?: Message;
  children: ReactNode;
};

const MessageContext = createContext<Message | undefined>(undefined);

export function useMessage() {
  return useContext(MessageContext);
}

export function MessageProvider({ message, children }: MessageProviderProps) {
  return (
    <MessageContext.Provider value={message}>
      {children}
    </MessageContext.Provider>
  );
}
