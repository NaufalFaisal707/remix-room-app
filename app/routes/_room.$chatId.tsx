import { useLoaderData } from "@remix-run/react";
import { CustomLoaderFunctionArgs } from "~/types";

export const loader = async ({ params, context }: CustomLoaderFunctionArgs) => {
  const { chatId } = params as { chatId: string };

  const { prisma } = context;

  const findUniqueUser = await prisma.user.findUnique({
    where: {
      id: chatId,
    },
    select: {
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

export default function ChatId() {
  const loaderData = useLoaderData<typeof loader>();

  return <div>{JSON.stringify(loaderData)}</div>;
}
