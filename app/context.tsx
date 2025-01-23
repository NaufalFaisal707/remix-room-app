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
