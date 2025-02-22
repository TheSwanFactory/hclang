import { HandlerContext } from "$fresh/server.ts";

export const handler = async (_req: Request, _ctx: HandlerContext) => {
  const html = await Deno.readFile("static/index.html");
  return new Response(html, {
    headers: {
      "content-type": "text/html",
    },
  });
};
