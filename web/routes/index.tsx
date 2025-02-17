import SendEmailButton from "../islands/EmailButton.tsx";

export default function Home() {
  return (
    <div>
      <head>
        <title>Home - SwanFactory Online</title>
      </head>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to the SwanFactory Online!
        </h1>

        <p className="text-lg mb-4">
          The SwanFactory online is your gateway to{" "}
          <strong>Polygogy</strong>—a revolutionary approach to lifelong
          learning that empowers everyone to grow, teach, and lead in a
          continuous cycle of transformation.
        </p>
        <p className="text-lg mb-4">
          Dive into the philosophy of Polygogy and discover how you can become a
          part of this dynamic learning movement:
        </p>
        <a
          className="text-blue-500 hover:underline mb-4 block text-2xl"
          href="https://theswanfactory.wordpress.com/2025/01/18/the-polygogy-manyfesto-reinventing-lifelong-learning/"
          target="_blank"
        >
          Read the Polygogy Manyfesto
        </a>
        <div class="p-4 mx-auto max-w-screen-md">
          <h3 class="text-2xl font-bold">Testing Email</h3>
          <SendEmailButton />
        </div>
        <p className="text-lg text-gray-750">
          Coming soon: subscribe to our mailing list.
        </p>
      </div>
    </div>
  );
}
