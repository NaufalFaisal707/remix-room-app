import { Form } from "@remix-run/react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export default function RIndex() {
  return (
    <div className="grid h-svh place-content-center">
      <Form method="POST" className="flex gap-4">
        <Input
          name="room_id"
          type="number"
          placeholder="enter or create room id"
        />
        <Button type="submit">join room</Button>
      </Form>
    </div>
  );
}
