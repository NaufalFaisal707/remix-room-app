import { Form } from "@remix-run/react";
import { Group, Send, User, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import Container2xl from "~/components/container-2xl";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useSocket, useUser } from "~/context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

type User = {
  uid: string;
  uname: string;
};

type Message = {
  type: "message";
  message_id: number;
  from_name: string;
  from: string;
  reply_message: number | undefined;
  body_message: string;
};

type Badge = {
  type: "badge";
  uname: string;
  status: "join" | "leave";
};

type MessageContent = Message | Badge;

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

  const [messages, setMessages] = useState<MessageContent[]>([]);
  const [replyMessage, setReplyMessage] = useState<number | undefined>();

  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;

    if (el.offsetTop + el.scrollTop >= el.scrollHeight - el.offsetHeight) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!replyMessage) return;

    textareaRef.current?.focus();
  }, [replyMessage]);

  const user = useUser();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("getOnlineUsers", setOnlineUsers);
    socket.on("newUserJoin", updateMessage);
    socket.on("newUserLeave", updateMessage);
    socket.on("newMessage", updateMessage);

    function updateMessage(message: MessageContent) {
      setMessages((prev) => [...prev, message]);
    }

    return () => {
      socket.off("getOnlineUsers", setOnlineUsers);
      socket.off("newMessage", updateMessage);
      socket.off("newUserJoin", updateMessage);
      socket.off("newUserLeave", updateMessage);
    };
  }, [socket]);

  function sendMessageHandler(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const { body_message } = Object.fromEntries(formData) as {
      body_message: string;
    };

    if (socket && user) {
      socket.emit("sendMessage", {
        type: "message",

        message_id: new Date().getTime(),

        from_name: user.full_name,
        from: user.id,

        reply_message: replyMessage,
        body_message,
      });
    }

    form.reset();
    setReplyMessage(undefined);
  }

  function getReplyMessage(id?: number): Message | undefined {
    return messages.find((f) => f.type === "message" && f.message_id === id) as
      | Message
      | undefined;
  }

  return (
    <Container2xl className="flex h-svh flex-col">
      <nav className="flex select-none items-center justify-between bg-white p-4">
        <div className="flex items-center gap-2">
          <Group />
          <span className="text-lg">Room</span>
        </div>

        <DialogOnlineUsers users={onlineUsers} />
      </nav>

      <div
        className="m-4 flex grow flex-col gap-2 overflow-hidden hover:overflow-auto"
        ref={scrollAreaRef}
      >
        {messages.map((m, key) => {
          if (m.type === "badge") {
            return (
              <div key={key} className="flex justify-center">
                <Badge>
                  {m.uname} {m.status}
                </Badge>
              </div>
            );
          }

          return (
            <div
              key={key}
              id={m.message_id + ""}
              className={cn(
                m.from === user?.id ? "" : "flex-row-reverse",
                "flex",
              )}
            >
              <span
                className="grow"
                onDoubleClick={() => setReplyMessage(m.message_id)}
              />
              <div
                className={cn(
                  m.from === user?.id ? "border" : "bg-neutral-100",
                  "max-w-[70%] select-none rounded-md",
                )}
              >
                {!!getReplyMessage(m.reply_message) && (
                  <div className="m-2 select-none rounded-md border bg-neutral-50 p-2">
                    <span>{getReplyMessage(m.reply_message)?.from_name}</span>
                    <p className="grid grid-cols-1 truncate text-neutral-600">
                      {getReplyMessage(m.reply_message)?.body_message}
                    </p>
                  </div>
                )}
                <div className="p-2">
                  {m.from !== user?.id && <span>{m.from_name}</span>}
                  <p className="grid select-text grid-cols-1 break-words text-neutral-600">
                    {m.body_message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <nav className="flex flex-col gap-4 bg-white p-4">
        {!!replyMessage && (
          <div className="flex items-center gap-4 rounded-md border p-2">
            <div className="grow">
              {getReplyMessage(replyMessage) ? (
                <>
                  <span>{getReplyMessage(replyMessage)?.from_name}</span>
                  <p className="grid select-text grid-cols-1 truncate text-neutral-600">
                    {getReplyMessage(replyMessage)?.body_message}
                  </p>
                </>
              ) : (
                "kosong!"
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setReplyMessage(undefined)}
            >
              <X />
            </Button>
          </div>
        )}
        <Form onSubmit={sendMessageHandler} className="flex gap-4">
          <Textarea
            required
            ref={textareaRef}
            className="max-h-16 min-h-0 resize-none whitespace-pre-line"
            placeholder="Ketik Pesan"
            name="body_message"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />

          <Button type="submit">
            <Send />
          </Button>
        </Form>
      </nav>
    </Container2xl>
  );
}
