import "./setup.ts";
import { afterEach, describe, it } from "jsr:@std/testing@1.0.15/bdd";
import { expect } from "jsr:@std/expect@1.0.17";

const {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} = await import("@testing-library/preact");
const { h } = await import("preact");
const { default: Main } = await import("../islands/Main.tsx");

async function submit(source: string): Promise<void> {
  fireEvent.input(screen.getByRole("textbox", { name: "HC source" }), {
    target: { value: source },
  });
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() => {
    const submitButton = screen.getByRole("button", {
      name: "Submit",
    }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(false);
  });
}

afterEach(cleanup);

describe("HC playground", () => {
  it("submits source, shows history, and resets", async () => {
    render(h(Main, {}));

    await submit("2 + 2");
    expect(screen.getByTestId("latest-output").textContent).toBe("4");
    expect(screen.getByRole("cell", { name: "2 + 2" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "4" })).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Reset interpreter" }),
    );
    expect(screen.getByTestId("latest-output").textContent).toContain(
      "Output will appear here",
    );
    expect(screen.queryByRole("cell", { name: "2 + 2" })).toBeNull();
    expect(screen.getByText("No evaluations yet.")).toBeTruthy();
  });

  it("recovers from an evaluation error", async () => {
    render(h(Main, {}));

    await submit("@");
    expect(screen.getByRole("alert").textContent).toContain("$!.");
    expect(screen.getByRole("cell", { name: /\$!\./ })).toBeTruthy();

    await submit("2 + 2");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByTestId("latest-output").textContent).toBe("4");
  });
});
