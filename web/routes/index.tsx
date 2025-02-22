import { Head } from "$fresh/runtime.ts";
import Main from "../islands/Main.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>HCLang Playground</title>
      </Head>
      <Main />
    </>
  );
}
