import { http, HttpResponse } from "msw";

import { render, screen } from "@tests/helpers/render";
import { API_URL, aGeneration } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { GenerationBarHost } from "@/features/plan-creation/components/GenerationBarHost";
import { TabBarBannerProvider, useShownTabBarBanner } from "@/ui/organisms/tab-bar/tab-bar-banner";

/** Draws whatever the tab bar would float above its tabs. */
function BannerSlot() {
  return <>{useShownTabBarBanner()}</>;
}

function renderHost() {
  return render(
    <TabBarBannerProvider>
      <GenerationBarHost />
      <BannerSlot />
    </TabBarBannerProvider>,
  );
}

describe("GenerationBarHost", () => {
  it("floats the plan being built above the tabs", async () => {
    server.use(
      http.get(`${API_URL}/v1/plan-generations/current`, () =>
        HttpResponse.json({ generations: [aGeneration()] }),
      ),
    );
    renderHost();

    expect(await screen.findByText("Generating plan")).toBeVisible();
  });

  it("floats nothing while nothing's being built", async () => {
    server.use(
      http.get(`${API_URL}/v1/plan-generations/current`, () =>
        HttpResponse.json({ generations: [] }),
      ),
    );
    renderHost();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByTestId("generation-bar")).toBeNull();
  });
});
