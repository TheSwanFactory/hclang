import { Handlers } from "$fresh/server.ts";
import { sendEmail } from "../../utils/mail.ts";

export const handler: Handlers = {
  async POST(req) {
    const { to, subject, text } = await req.json();
    const status = await sendEmail(to, subject, text);
    if (status < 300) {
      return new Response("Email sent successfully", { status: status });
    } else {
      return new Response("Failed to send email", { status: status });
    }
  },
};
