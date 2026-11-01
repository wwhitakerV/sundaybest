import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { usePlansQuery } from "@/core/api/plan-queries";
import { usePrefetch } from "@/core/api/prefetch";
import { selectionFeedback } from "@/core/haptics/haptics";
import { prefetchImages } from "@/core/images/prefetch-images";
import { usePlansOpened } from "@/core/storage/plan-opened-queries";
import { getApiUserPlans } from "../logic/api-plan-collections";
import { libraryRows } from "../logic/library-rows";
import {
  arrangeLibrary,
  describeColophon,
  libraryShelves,
  type LibraryShelf,
} from "../logic/plan-library";
import { PLANS_SEARCH_AT } from "../logic/plan-search";

/** Plans whose own pages are fetched ahead, from the top of the shelf: what's about to be seen. */
const AHEAD = 4;

/**
 * The Plans tab as a library: the reader's plans arranged (`arrangeLibrary`)
 * by when they were last opened on this phone, shelved — My studies, and
 * Done once a plan's finished — as the list's rows; the top of the shelf's
 * plans fetched ahead, every plan's artwork too; and, from two plans, the
 * search.
 */
export function usePlanLibrary() {
  const router = useRouter();
  const plansQuery = usePlansQuery();
  const opened = usePlansOpened();
  const plans = plansQuery.data?.plans ?? [];
  const library = arrangeLibrary(plans, opened);
  const [picked, setPicked] = useState<LibraryShelf>("My studies");
  const shelf = libraryShelves(library).includes(picked) ? picked : "My studies";
  const rows = libraryRows(library, shelf, describeColophon(plans));

  const prefetch = usePrefetch();
  const ahead = rows
    .flatMap((row) => (row.kind === "lead" || row.kind === "plan" ? [row.plan.id] : []))
    .slice(0, AHEAD)
    .join(",");
  useEffect(() => {
    for (const planId of ahead.split(",").filter(Boolean)) prefetch.plan(planId);
  }, [ahead, prefetch]);
  const artwork = plans.map((plan) => plan.sermon.thumbnailUrl).join("\n");
  useEffect(() => {
    prefetchImages(artwork.split("\n"));
  }, [artwork]);

  return {
    loading: plansQuery.isPending,
    error: plansQuery.data === undefined ? plansQuery.error : null,
    retry: () => void plansQuery.refetch(),
    rows,
    shelf,
    /** A shelf picked: the list changes to it. */
    pickShelf: (next: LibraryShelf) => {
      if (next === shelf) return;
      selectionFeedback();
      setPicked(next);
    },
    searchable: getApiUserPlans(plans).length >= PLANS_SEARCH_AT,
    openSearch: () => router.push("/plan-search"),
  };
}
