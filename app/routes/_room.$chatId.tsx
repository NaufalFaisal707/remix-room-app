import {
  ClientLoaderFunctionArgs,
  Form,
  Link,
  useLoaderData,
  useNavigate,
  useRouteLoaderData,
} from "@remix-run/react";
import {
  ChevronLeft,
  CircleUserRound,
  MessageSquareText,
  Send,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Message, useChat, useMessage, useSocket } from "~/context";
import { cn } from "~/lib/utils";
import { CustomLoaderFunctionArgs } from "~/types";

export const loader = async ({ params, context }: CustomLoaderFunctionArgs) => {
  const { chatId } = params as { chatId: string };

  const { prisma } = context;

  const findUniqueUser = await prisma.user.findUnique({
    where: {
      id: chatId,
    },
    select: {
      id: true,
      full_name: true,
    },
  });

  if (!findUniqueUser) {
    throw Response.json(null, {
      status: 404,
      statusText: "tidak ada user yang terhubung dengan ID chat ini!",
    });
  }

  return findUniqueUser;
};

let cacheClientLoader: {
  id: string;
  full_name: string;
};

export const clientLoader = async ({
  params,
  serverLoader,
}: ClientLoaderFunctionArgs) => {
  const { chatId } = params as { chatId: string };

  if (cacheClientLoader && cacheClientLoader.id === chatId) {
    return cacheClientLoader;
  }

  cacheClientLoader = await serverLoader();

  return cacheClientLoader;
};

export default function ChatId() {
  const routeLoaderData = useRouteLoaderData("routes/_room") as {
    id: string;
    full_name: string;
    created_at: string;
    logout_at: string | null;
  };

  const loaderData = useLoaderData<typeof loader>();

  const navigation = useNavigate();

  const chats = useChat();

  const isTargetChatOnline = chats.some(
    (chat) => chat.chat_id === loaderData.id,
  );

  const message = useMessage();

  const [messages, setMessages] = useState<Message[]>([]);

  const addMessageWithoutDuplicates = (newMessage: Message) => {
    setMessages((prev) => {
      const isDuplicate = prev.some(
        (msg) => msg.date_time === newMessage.date_time,
      );
      if (isDuplicate) {
        return prev;
      }
      return [...prev, newMessage];
    });
  };

  useEffect(() => {
    if (!message) return;
    if (message.from === loaderData.id || message.from === routeLoaderData.id) {
      addMessageWithoutDuplicates(message);
    }
  }, [loaderData.id, message, routeLoaderData.id]);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("getNotify", pushToast);

    function pushToast(data: Message) {
      if (data.from === loaderData.id || data.from === routeLoaderData.id) {
        return;
      }

      toast(chats.find((f) => f.chat_id === data.from)?.user_full_name, {
        description: data.body_message,
        action: {
          label: "Balas",
          onClick: () => navigation("/" + data.from),
        },
      });
    }

    return () => {
      socket.off("getNotify", pushToast);
    };
  }, [chats, loaderData.id, navigation, routeLoaderData.id, socket]);

  function submitHandler(e: FormEvent) {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const { body_message } = Object.fromEntries(new FormData(form)) as {
      body_message: string;
    };

    const date_time = new Date().getTime();

    socket?.emit("sendMessage", {
      target: loaderData.id,
      from: routeLoaderData.id,
      body_message,
      date_time,
    });

    form.reset();
  }

  const Navbar = (
    <nav className="sticky top-0 flex items-center gap-2 bg-white p-4">
      <Button variant="ghost" size="icon" asChild>
        <Link to="/">
          <ChevronLeft />
        </Link>
      </Button>

      <div className="flex w-full select-none items-center gap-2 truncate">
        <span className="rounded-md bg-neutral-100 p-2">
          <CircleUserRound />
        </span>
        <div className="grid">
          <span className="max-w-40 truncate capitalize">
            {loaderData.full_name}
          </span>

          {isTargetChatOnline ? (
            <span className="text-xs text-neutral-400">Aktif</span>
          ) : (
            <span className="text-xs text-neutral-400">Tidak Aktif</span>
          )}
        </div>
      </div>
    </nav>
  );

  const ActiveMessage = () => {
    if (messages.length === 0) {
      return (
        <div className="flex grow select-none flex-col items-center justify-center gap-4 opacity-60">
          <MessageSquareText className="size-12" />
          <h1>Belum ada pesan</h1>
        </div>
      );
    }

    return (
      <ScrollArea className="grow">
        <div className="grid gap-2 overflow-auto p-4">
          {messages.map((m, key) => {
            return (
              <span
                key={key}
                className={cn(
                  "w-fit max-w-[calc(100svw_-_32px)] break-words rounded-md p-2",
                  m.from === routeLoaderData.id
                    ? "justify-self-end border text-end"
                    : "bg-neutral-200",
                )}
              >
                {m.body_message}
              </span>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  const MessageInput = (
    <Form
      method="POST"
      className="sticky bottom-0 flex items-center gap-2 bg-white p-4"
      onSubmit={submitHandler}
    >
      <div className="flex w-full select-none items-center gap-2 truncate">
        <Input
          name="body_message"
          placeholder="Ketik pesan"
          autoComplete="off"
        />
      </div>

      <Button variant="outline" type="submit">
        <Send />
      </Button>
    </Form>
  );

  return (
    <div className="relative mx-auto flex h-svh w-svw max-w-screen-sm flex-col">
      {Navbar}

      <ActiveMessage />

      {MessageInput}
    </div>
  );
}
