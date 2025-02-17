import { useState } from "preact/hooks";

export default function SendEmailButton() {
  const [status, setStatus] = useState<string | null>(null);

  const handleClick = async () => {
    setStatus("Sending...");
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "ernest@drernie.com",
          subject: "Hello from Deno Fresh",
          text: "This is a test email sent from a Deno Fresh application.",
        }),
      });

      if (response.ok) {
        setStatus("Email sent successfully!");
      } else {
        setStatus("Failed to send email.");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setStatus("An error occurred.");
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        class="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Send Email
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}
