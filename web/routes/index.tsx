import { HandlerContext } from "$fresh/server.ts";

export const handler = {
  GET: async (_req: Request, ctx: HandlerContext) => {
    try {
      const content = await Deno.readFile("./static/index.html");
      return new Response(content, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    } catch (e) {
      console.error("Error serving index.html:", e);
      return ctx.render(null);
    }
  },
};
