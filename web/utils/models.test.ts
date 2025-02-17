import { assertEquals, assertNotEquals } from "jsr:@std/assert";
import { db, User } from "./models.ts";

Deno.test("Upsert User into db", async () => {
  const user: User = { realm: "test.user" };

  const result = await db.users.upsertByPrimaryIndex({
    index: ["realm", user.realm],
    update: user,
    set: user,
  });
  assertEquals(result.ok, true);

  const one = await db.users.getOne();
  assertNotEquals(one, null);
  assertEquals(one?.value.realm, user.realm);

  if (one?.id !== undefined) {
    await db.users.delete(one.id);
  } else {
    throw new Error("user_id is undefined");
  }
});
