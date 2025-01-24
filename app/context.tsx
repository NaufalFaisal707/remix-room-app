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

type User = {
  full_name: string;
  logout: boolean;
  create_at: Date;
  logout_at: null | Date;
};

const UserContext = createContext<User | undefined>(undefined);

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
