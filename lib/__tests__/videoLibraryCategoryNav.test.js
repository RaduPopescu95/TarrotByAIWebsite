import {
  buildVideoLibraryCategoryNavItems,
  collectVideoCategoryNames,
} from "../videoLibraryCategoryNav";

describe("videoLibraryCategoryNav", () => {
  test("collectVideoCategoryNames deduplicates trimmed names", () => {
    expect(
      collectVideoCategoryNames([
        { category: " Berbec " },
        { category: "Berbec" },
        { category: "" },
        { category: "Taur" },
      ])
    ).toEqual(new Set(["Berbec", "Taur"]));
  });

  test("buildVideoLibraryCategoryNavItems localizes and filters by videos on main", () => {
    const docs = [
      { name: "Berbec", slug: "berbec", locales: { ro: "Berbec RO" } },
      { name: "Taur", slug: "taur", locales: { ro: "Taur RO" } },
    ];
    const withVideos = buildVideoLibraryCategoryNavItems(docs, "ro", {
      onlyWithVideos: true,
      videoCategoryNames: new Set(["Berbec"]),
    });
    expect(withVideos).toEqual([{ name: "Berbec", slug: "berbec", label: "Berbec RO" }]);

    const all = buildVideoLibraryCategoryNavItems(docs, "ro");
    expect(all).toHaveLength(2);
    expect(all[0].label).toBe("Berbec RO");
  });
});
