import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const origin = new URL(req.url).origin;

  // Verify the handle we are injecting
  console.log("DEBUG: Generating embed script for handle:", handle);

  const js = `
(function () {
  const handle = ${JSON.stringify(handle)};
  const origin = ${JSON.stringify(origin)};
  console.log("DEBUG: Widget loaded. Handle:", handle);

  const widget =
    document.querySelector('[data-availability-widget]') ||
    document.getElementById('availability-widget');

  if (!widget) {
    console.error("Availability widget element not found");
    return;
  }

  async function loadAvailability() {
    try {
      const url = origin + "/u/" + encodeURIComponent(handle) + "/availability.json";
      console.log("DEBUG: Fetching availability from:", url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("HTTP error! status: " + response.status);
      }

      const data = await response.json();

      const status = data.status?.state || "offline";
      const message = data.status?.message || "";
      const timezone = data.user?.timezone || "";

      widget.innerHTML =
        '<div style="font-family: system-ui, sans-serif; border: 1px solid #ddd; border-radius: 8px; padding: 12px; max-width: 280px;">' +
          '<div style="font-weight: 600;">Availability</div>' +
          '<div>Status: ' + escapeHtml(status) + '</div>' +
          (message ? '<div>' + escapeHtml(message) + '</div>' : '') +
          (timezone ? '<div style="font-size: 12px; color: #666;">' + escapeHtml(timezone) + '</div>' : '') +
        '</div>';
    } catch (error) {
      console.error("Error fetching availability data:", error);
      widget.innerHTML = "Availability unavailable";
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  loadAvailability();
})();
`;

  return new NextResponse(js, {
    status: 200,
    headers: { 
        'Content-Type': 'application/javascript; charset=utf-8', 
        'Cache-Control': 'no-store' 
    },
  });
}
