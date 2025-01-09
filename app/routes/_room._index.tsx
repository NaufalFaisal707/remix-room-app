import { Form, Link } from "@remix-run/react";
import {
  CircleUserRound,
  Group,
  LogOut,
  Menu,
  SearchX,
  Unplug,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouteLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useSocket } from "~/context";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

export default function Index() {
  const loaderData = useRouteLoaderData("routes/_room") as {
    id: string;
    full_name: string;
    created_at: string;
    logout_at: string | null;
  };

  const [cariPengguna, setCariPengguna] = useState("");

  const [chats, setChats] = useState<
    {
      chat_id: string;
      user_full_name: string;
    }[]
  >([]);

  function filterChats() {
    if (cariPengguna) {
      return chats.filter(
        (f) =>
          f.chat_id !== loaderData.id &&
          f.user_full_name.toLowerCase().includes(cariPengguna.toLowerCase()),
      );
    }
    return chats.filter((f) => f.chat_id !== loaderData.id);
  }

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.emit("getAllChat");
    socket.on("getAllChat", setChats);

    socket.connect();

    return () => {
      socket.off("getAllChat", setChats);
    };
  }, [socket]);

  const SheetMenu = (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent className="z-50 flex flex-col">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription />
        </SheetHeader>

        <div className="grow"></div>

        <SheetFooter>
          <Form action="/logout" method="POST" className="w-full *:w-full">
            <Button type="submit" variant="destructive">
              <LogOut />
              Keluar Akun
            </Button>
          </Form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  const Navbar = (
    <nav className="sticky top-0 flex items-center justify-between gap-4 bg-white p-4">
      <div className="hidden select-none items-center gap-2 truncate md:flex">
        <Group className="min-w-fit" />
        <h1 className="text-lg">Room</h1>
      </div>

      <div className="flex w-full gap-2 md:w-fit">
        <Input
          onChange={({ target }) => setCariPengguna(target.value)}
          title="cari pengguna"
          placeholder="Cari pengguna"
          type="search"
        />

        {SheetMenu}
      </div>
    </nav>
  );

  const ActiveChats = () => {
    if (filterChats().length === 0 && cariPengguna) {
      return (
        <div className="flex grow select-none flex-col items-center justify-center gap-4 opacity-60">
          <SearchX className="size-12" />
          <h1>Tidak di temukan hasil dari pencarian</h1>
        </div>
      );
    }

    if (filterChats().length === 0) {
      return (
        <div className="flex grow select-none flex-col items-center justify-center gap-4 opacity-60">
          <Unplug className="size-12" />
          <h1>Tidak ada pengguna aktif</h1>
        </div>
      );
    }

    return (
      <ScrollArea>
        <div className="grid flex-wrap gap-2 overflow-auto p-4">
          {filterChats().map((m, key) => {
            return (
              <ChatCard
                key={key}
                chat_id={m.chat_id}
                user_full_name={m.user_full_name}
              />
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  const ChatCard = ({
    user_full_name,
    chat_id,
  }: {
    user_full_name: string;
    chat_id: string;
  }) => {
    return (
      <Link
        to={"/" + chat_id}
        title={user_full_name}
        className="flex items-center gap-4 rounded-md border p-2 hover:bg-neutral-100"
      >
        <span className="rounded-md bg-neutral-100 p-2">
          <CircleUserRound />
        </span>
        <span className="max-w-40 truncate capitalize">{user_full_name}</span>
      </Link>
    );
  };

  return (
    <div className="relative mx-auto flex h-svh w-svw max-w-screen-sm flex-col">
      {Navbar}

      <ActiveChats />
    </div>
  );

  // return (
  //   <div className="grid place-content-center h-svh">
  //     <p>{JSON.stringify(loaderData)}</p>
  //     <p>{JSON.stringify(chats)}</p>
  //     <div className="flex gap-2">

  //       <Button onClick={sendPing}>Send Ping</Button>
  //     </div>
  //   </div>
  // );
}
