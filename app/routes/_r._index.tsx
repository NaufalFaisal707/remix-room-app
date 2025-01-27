import { Form } from "@remix-run/react";
import { Group, Send, User } from "lucide-react";
import { useEffect, useState } from "react";
import Container2xl from "~/components/container-2xl";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useSocket } from "~/context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";

type User = {
  uid: string;
  uname: string;
};

const DialogOnlineUsers = ({ users }: { users: User[] }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline">{users.length} Aktif</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Pengguna Aktif</DialogTitle>
        <DialogDescription />
      </DialogHeader>

      <ScrollArea>
        <div className="grid max-h-96 select-none grid-cols-1 gap-2">
          {users.map(({ uname }, key) => {
            return (
              <div
                key={key}
                className="flex items-center gap-4 rounded-md border p-2 hover:bg-neutral-100"
              >
                <span className="rounded-md bg-neutral-100 p-2">
                  <User />
                </span>
                <span className="truncate">{uname}</span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
);

export default function RIndex() {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("getOnlineUsers", setOnlineUsers);

    socket.on("newUserJoin", (data) => {
      console.log("join", data);
    });

    socket.on("newUserLeave", (data) => {
      console.log("leave", data);
    });

    socket.on("disconnect", () => console.log("aku dc wak!"));

    return () => {
      socket.off("getOnlineUsers", setOnlineUsers);
      socket.off("newUserJoin");
      socket.off("newUserLeave");
      socket.off("disconnect");
    };
  }, [socket]);

  return (
    <Container2xl className="flex h-svh flex-col">
      <nav className="flex select-none items-center justify-between bg-white p-4">
        <div className="flex items-center gap-2">
          <Group />
          <span className="text-lg">Room</span>
        </div>

        <DialogOnlineUsers users={onlineUsers} />
      </nav>

      <ScrollArea className="h-full grow">
        <div></div>
      </ScrollArea>

      <nav className="bg-white p-4">
        <Form className="flex gap-4">
          <Textarea
            className="max-h-16 min-h-0 resize-none"
            placeholder="Ketik Pesan"
          />
          <Button type="submit">
            <Send />
          </Button>
        </Form>
      </nav>
    </Container2xl>
  );
}
