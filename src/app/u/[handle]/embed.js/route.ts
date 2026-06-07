import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const origin = new URL(req.url).origin;

  const js = `
(function () {
  const handle = ${JSON.stringify(handle)};
  const origin = ${JSON.stringify(origin)};
  
  const pollForWidget = setInterval(() => {
    const widgetContainer = document.getElementById('availability-widget') || document.querySelector('[data-availability-widget]');
    if (widgetContainer) {
      clearInterval(pollForWidget);
      initWidget(widgetContainer);
    }
  }, 100);

  setTimeout(() => clearInterval(pollForWidget), 10000);

  const initWidget = (widgetContainer) => {
    const shadowRoot = widgetContainer.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = \`
      :host {
        --bg: #ffffff; --text: #1f2937; --border: #e2e8f0; --text-secondary: #4b5563;
      }
      :host-context(.dark) {
        --bg: #1f2937; --text: #f9fafb; --border: #374151; --text-secondary: #9ca3af;
      }
      .availeasy-widget { font-family: system-ui, sans-serif; border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.5rem; max-width: 320px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); color: var(--text); background-color: var(--bg); }
      .availeasy-status { display: flex; align-items: center; gap: 0.75rem; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
      .availeasy-status-indicator { width: 0.75rem; height: 0.75rem; border-radius: 9999px; }
      .availeasy-status-indicator.available { background-color: #10b981; }
      .availeasy-status-indicator.busy { background-color: #ef4444; }
      .availeasy-status-indicator.away { background-color: #f59e0b; }
      .availeasy-status-indicator.offline { background-color: #6b7280; }
      .availeasy-status-indicator.custom { background-color: #6366f1; }
      .availeasy-message { font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 1rem; }
      .availeasy-next-window { font-size: 0.875rem; color: var(--text-secondary); border-top: 1px solid var(--border); padding-top: 1rem; }
      .availeasy-timezone { font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.75rem; }
    \`;
    shadowRoot.appendChild(style);

    const rootDiv = document.createElement('div');
    rootDiv.className = 'availeasy-widget';
    shadowRoot.appendChild(rootDiv);

    if (document.documentElement.classList.contains('dark')) {
      widgetContainer.classList.add('dark');
    }

    fetch(origin + '/u/' + encodeURIComponent(handle) + '/availability.json')
      .then(response => response.json())
      .then(data => {
        const status = data.status;
        const windows = data.windows;
        const userTimezone = data.user.timezone;
        
        let html = '<div class="availeasy-status">' +
            '<span class="availeasy-status-indicator ' + status.state.toLowerCase() + '"></span>' +
            '<span>' + status.state.charAt(0).toUpperCase() + status.state.slice(1) + '</span>' +
          '</div>';
          
        if (status.message) {
            html += '<div class="availeasy-message">' + escapeHtml(status.message) + '</div>';
        }
        if (status.valid_until) {
            html += '<div class="availeasy-message" style="font-size: 0.8rem;">Until: ' + new Date(status.valid_until).toLocaleString(undefined, { timeZone: userTimezone, hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short' }) + '</div>';
        }
        
        if (windows.length > 0 && windows[0].state === 'available') {
            html += '<div class="availeasy-next-window">Next available: ' + new Date(windows[0].start).toLocaleString(undefined, { timeZone: userTimezone, hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short' }) + '</div>';
        } else {
            html += '<div class="availeasy-next-window">No upcoming availability</div>';
        }
        
        html += '<div class="availeasy-timezone">Timezone: ' + userTimezone + '</div>';
        rootDiv.innerHTML = html;
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        rootDiv.innerHTML = '<div>Failed to load availability.</div>';
      });
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
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
