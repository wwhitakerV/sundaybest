import {
  examOverviewHref,
  examPassagesHref,
  examSubjectHref,
  examSubjectsHref,
  examTopicsHref,
  theologyExamsHref,
  theologyExamsSubjectHref,
} from "@/features/exams/logic/routes";

describe("exam routes", () => {
  it("keeps the exams page in Fun's stack", () => {
    expect(theologyExamsHref).toBe("/(tabs)/fun/theology-exams");
  });

  it("opens an exam's overview above the tabs, so it has the screen to itself", () => {
    expect(examOverviewHref("THEO-01-01")).toEqual({
      pathname: "/exams/[examId]",
      params: { examId: "THEO-01-01" },
    });
  });

  it("opens an exam's topics in a sheet over its overview", () => {
    expect(examTopicsHref("THEO-01-01")).toEqual({
      pathname: "/exams/[examId]/topics",
      params: { examId: "THEO-01-01" },
    });
  });

  it("opens an exam's passages in a sheet over its overview", () => {
    expect(examPassagesHref("THEO-01-01")).toEqual({
      pathname: "/exams/[examId]/passages",
      params: { examId: "THEO-01-01" },
    });
  });

  it("opens every subject in a sheet over the exams page", () => {
    expect(examSubjectsHref).toBe("/(tabs)/fun/exam-subjects");
  });

  it("brings the exams page back open on a subject", () => {
    expect(theologyExamsSubjectHref("THEO-02")).toEqual({
      pathname: "/(tabs)/fun/theology-exams",
      params: { subject: "THEO-02" },
    });
  });

  it("opens a subject's exams in Fun's stack", () => {
    expect(examSubjectHref("THEO-01")).toEqual({
      pathname: "/(tabs)/fun/exam-subject/[subjectId]",
      params: { subjectId: "THEO-01" },
    });
  });
});
