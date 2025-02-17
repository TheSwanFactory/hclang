import { collection, kvdex, model } from "@olli/kvdex";
import { jsonEncoder } from "@olli/kvdex/encoding/json";

export type User = {
  realm: string;
};

// Asymmetric model (mapped output)
export const UserModel = model((user: User) => ({
  id: `https://igwet.com/users/${user.realm}`,
  realm: user.realm,
}));

const kv = await Deno.openKv();

export const db = kvdex({
  kv: kv,
  schema: {
    numbers: collection(model<number>()),
    serializedStrings: collection(model<string>(), {
      encoder: jsonEncoder(),
    }),
    users: collection(UserModel, {
      history: true,
      indices: {
        realm: "primary",
      },
    }),
    // Nested collections
    nested: {
      strings: collection(model<string>()),
    },
  },
});
