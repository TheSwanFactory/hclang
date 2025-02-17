import Mailgun from "@schotsl/mailgun";

const apiKey = Deno.env.get("MAILGUN_API_KEY");
const domain = Deno.env.get("MAILGUN_DOMAIN");

if (!apiKey || !domain) {
  throw new Error(
    "MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables must be set",
  );
}

console.log("Mailgun API key:", apiKey);
console.log("Mailgun domain:", domain);

const mailgun = new Mailgun({
  key: apiKey,
  domain: domain,
  region: "us", // or "eu" based on your Mailgun account
});

console.log("Mailgun client:", mailgun);

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  from: string = "info@mg.swanfactory.online",
) {
  console.log(`Sending email to ${to}...`);
  const response = await mailgun.send({ to, from, subject, text });
  if (response.ok) {
    console.log(`Email sent to ${to}`, response);
  } else {
    console.error(
      `Error[${response.status}]: ${response.statusText}`,
      response,
    );
  }
  return response.status;
}
