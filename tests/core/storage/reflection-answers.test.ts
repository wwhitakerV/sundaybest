import { getAppDatabase } from "@/core/storage/database/app-database";
import { deleteReflectionAnswers } from "@/core/storage/reflection-answers";

jest.mock("@/core/storage/database/app-database", () => ({ getAppDatabase: jest.fn() }));

const execute = jest.fn<Promise<void>, [string, unknown[]]>(() => Promise.resolve());

describe("deleteReflectionAnswers", () => {
  beforeEach(() => {
    execute.mockClear();
    jest.mocked(getAppDatabase).mockResolvedValue({ execute } as never);
  });

  it("clears only this reader's answers to the given questions", async () => {
    await deleteReflectionAnswers("user-1", ["r1", "r2"]);

    expect(execute).toHaveBeenCalledWith(
      "DELETE FROM reflection_answers WHERE user_id = ? AND reflection_id IN (?, ?)",
      ["user-1", "r1", "r2"],
    );
  });

  it("does nothing for no questions", async () => {
    await deleteReflectionAnswers("user-1", []);

    expect(execute).not.toHaveBeenCalled();
  });
});
