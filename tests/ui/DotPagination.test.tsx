import { render, screen } from "@tests/helpers/render";

import { DotPagination } from "@/ui/DotPagination";

describe("DotPagination", () => {
  it("forwards testID to the outermost view", () => {
    render(<DotPagination testID="a-dot-pagination" count={3} activeIndex={0} />);

    expect(screen.getByTestId("a-dot-pagination")).toBeVisible();
  });

  it("renders one dot per item", () => {
    render(<DotPagination testID="a-dot-pagination" count={3} activeIndex={0} />);

    expect(screen.getByTestId("a-dot-pagination-dot-0")).toBeVisible();
    expect(screen.getByTestId("a-dot-pagination-dot-1")).toBeVisible();
    expect(screen.getByTestId("a-dot-pagination-dot-2")).toBeVisible();
    expect(screen.queryByTestId("a-dot-pagination-dot-3")).toBeNull();
  });

  it("fills the active dot dark", () => {
    render(<DotPagination testID="a-dot-pagination" count={3} activeIndex={1} />);

    expect(screen.getByTestId("a-dot-pagination-dot-1")).toHaveStyle({
      backgroundColor: "#08090A",
    });
  });

  it("colours an inactive dot grey", () => {
    render(<DotPagination testID="a-dot-pagination" count={3} activeIndex={1} />);

    expect(screen.getByTestId("a-dot-pagination-dot-0")).toHaveStyle({
      backgroundColor: "#d2d2d0",
    });
  });

  describe("pill variant", () => {
    it("widens the active dot into a pill", () => {
      render(<DotPagination testID="a-dot-pagination" count={3} activeIndex={1} variant="pill" />);

      const activeDot = screen.getByTestId("a-dot-pagination-dot-1");
      const inactiveDot = screen.getByTestId("a-dot-pagination-dot-0");

      expect(activeDot).toHaveStyle({ width: 20 });
      expect(inactiveDot).toHaveStyle({ width: 6 });
    });
  });
});
