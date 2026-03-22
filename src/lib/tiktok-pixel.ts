/**
 * TikTok Pixel event tracking helpers.
 * Call these from client components to fire TikTok conversion events.
 *
 * Standard TikTok events:
 * - ViewContent: User views an event/page
 * - ClickButton: User clicks a CTA
 * - CompleteRegistration: User signs up
 * - Search: User searches for something
 * - AddToWishlist: User adds to watchlist
 */

function getTTQ(): any {
  if (typeof window !== "undefined" && (window as any).ttq) {
    return (window as any).ttq;
  }
  return null;
}

/** Track when a user views an event detail page */
export function trackViewContent(contentName: string, contentId?: string) {
  const ttq = getTTQ();
  if (ttq) {
    ttq.track("ViewContent", {
      content_name: contentName,
      content_id: contentId,
      content_type: "product",
    });
  }
}

/** Track when a user completes registration */
export function trackCompleteRegistration(method: "email" | "google") {
  const ttq = getTTQ();
  if (ttq) {
    ttq.track("CompleteRegistration", {
      content_name: `${method}_signup`,
    });
  }
}

/** Track when a user searches for events */
export function trackSearch(query: string) {
  const ttq = getTTQ();
  if (ttq) {
    ttq.track("Search", {
      query,
    });
  }
}

/** Track when a user adds an artist/venue to their watchlist */
export function trackAddToWishlist(contentName: string, contentType: string) {
  const ttq = getTTQ();
  if (ttq) {
    ttq.track("AddToWishlist", {
      content_name: contentName,
      content_type: contentType,
    });
  }
}

/** Track when a user clicks a CTA button */
export function trackClickButton(buttonName: string) {
  const ttq = getTTQ();
  if (ttq) {
    ttq.track("ClickButton", {
      content_name: buttonName,
    });
  }
}
