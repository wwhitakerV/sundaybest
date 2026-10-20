import { MEET_THE_CREATOR } from "@/features/settings/logic/meet-the-creator";

const BLOCKS = MEET_THE_CREATOR.sections.flatMap(({ blocks }) => blocks);

describe("MEET_THE_CREATOR", () => {
  it("introduces Walter: his name and what he does", () => {
    expect(MEET_THE_CREATOR.identity).toEqual({
      name: "Walter Whitaker",
      role: "Creator, Engineer & Designer",
    });
  });

  it("gives his facts at a glance: where he is, how long he's built software, and for whom", () => {
    expect(MEET_THE_CREATOR.facts.map(({ icon }) => icon)).toEqual([
      "place",
      "experience",
      "clients",
    ]);
    expect(MEET_THE_CREATOR.facts[0]?.text).toBe("Dallas, TX");
  });

  it("opens his letter on why he built it", () => {
    expect(MEET_THE_CREATOR.standfirst).toBe(
      "I wanted to build something worth paying attention to.",
    );
  });

  it("tells the rest in a few short sections, each under a plain heading", () => {
    expect(MEET_THE_CREATOR.sections.map(({ heading }) => heading)).toEqual([
      undefined,
      "Before SundayBest",
      "The faith behind it",
      "The small decisions",
      "Knowing its place",
      "Still building",
    ]);
  });

  it("names where he built software before", () => {
    const clients = MEET_THE_CREATOR.facts.find(({ icon }) => icon === "clients");

    expect(clients?.text).toMatch(
      /Apple, the NBA, General Motors, Magna, The Home Depot, and Kroger/,
    );
  });

  it("keeps every paragraph short enough to read at a glance", () => {
    const long = BLOCKS.filter((block) => block.kind === "paragraph" && block.text.length > 240);

    expect(long).toEqual([]);
  });

  it("features one line, as a reading page does", () => {
    expect(BLOCKS.filter((block) => block.kind === "quote")).toEqual([
      { kind: "quote", text: "What we hear on Sunday should have a life beyond Sunday." },
    ]);
  });

  it("signs off in his name", () => {
    expect(MEET_THE_CREATOR.signOff).toEqual({
      name: "Walter",
      role: "Creator, Engineer & Designer",
      motto: "Built with conviction. For a life of conviction.",
    });
  });
});
