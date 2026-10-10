import { render, screen } from "@tests/helpers/render";

import { AboutRows } from "@/features/settings/components/AboutRows";

describe("AboutRows", () => {
  it("has no outline when its rows are only read", () => {
    render(
      <AboutRows
        testID="rows"
        rows={[
          { key: "a", title: "No account", text: "There's nothing to sign in to." },
          { key: "b", text: "Your reflections stay on this iPhone." },
        ]}
      />,
    );

    expect(screen.getByTestId("rows")).toHaveStyle({ borderWidth: 0 });
  });

  it("keeps its outline when a row goes somewhere", () => {
    render(
      <AboutRows
        testID="rows"
        rows={[
          { key: "a", title: "What we keep" },
          { key: "b", title: "Your controls", onPress: jest.fn() },
        ]}
      />,
    );

    expect(screen.getByTestId("rows")).toHaveStyle({ borderWidth: 1 });
  });
});
