import { render, screen } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Text } from "react-native";

import { OfflineCacheHydrator } from "@/core/providers/OfflineCacheHydrator";

describe("OfflineCacheHydrator", () => {
  it("renders its children on the first frame when the cache is already loaded", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <OfflineCacheHydrator preloaded={[]}>
          <Text>ready</Text>
        </OfflineCacheHydrator>
      </QueryClientProvider>,
    );

    expect(screen.getByText("ready")).toBeVisible();
  });
});
