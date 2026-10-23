import SiteFrame from "@/components/layout/SiteFrame";
import NotFoundView from "@/components/content/NotFoundView";

/**
 * The 404 page for the whole app (it sits above the `(site)` group, so it also
 * catches a mistyped `/admin/...` URL). It renders the ordinary site chrome so a
 * lost visitor can navigate out instead of hitting a dead end.
 */
export default function NotFound() {
  return (
    <SiteFrame>
      <NotFoundView />
    </SiteFrame>
  );
}
