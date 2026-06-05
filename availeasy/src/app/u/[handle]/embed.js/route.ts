import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { handle: string } }
) {
  const { handle } = params;

  const scriptContent = `
    (function() {
      const handle = "${handle}";
      const widgetContainer = document.getElementById('availability-widget') || document.querySelector('[data-availability-widget]');
      if (!widgetContainer) {
        console.warn('Availability widget container not found. Ensure an element with id="availability-widget" or data-availability-widget exists.');
        return;
      }

      // Create a shadow root for encapsulation
      const shadowRoot = widgetContainer.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        .availeasy-widget {
          font-family: sans-serif;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          padding: 1rem;
          max-width: 300px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          color: #2d3748;
          background-color: #ffffff;
        }
        .availeasy-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
        }
        .availeasy-status-indicator {
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 9999px;
          background-color: #cbd5e0; /* Default offline/unknown */
        }
        .availeasy-status-indicator.available { background-color: #10b981; }
        .availeasy-status-indicator.busy { background-color: #ef4444; }
        .availeasy-status-indicator.away { background-color: #f59e0b; }
        .availeasy-status-indicator.offline { background-color: #64748b; }
        .availeasy-status-indicator.custom { background-color: #6366f1; }

        .availeasy-message {
          font-size: 0.875rem;
          color: #4a5568;
          margin-top: 0.5rem;
        }
        .availeasy-next-window {
          font-size: 0.875rem;
          color: #4a5568;
          margin-top: 1rem;
          border-top: 1px solid #e2e8f0;
          padding-top: 1rem;
        }
        .availeasy-timezone {
          font-size: 0.75rem;
          color: #718096;
          margin-top: 0.5rem;
        }
      `;
      shadowRoot.appendChild(style);

      const rootDiv = document.createElement('div');
      rootDiv.className = 'availeasy-widget';
      shadowRoot.appendChild(rootDiv);

      const renderWidget = (data) => {
        const status = data.status;
        const windows = data.windows;
        const userTimezone = data.user.timezone;

        rootDiv.innerHTML = `
          <div class="availeasy-status">
            <span class="availeasy-status-indicator \${status.state.toLowerCase()}"></span>
            <span>\${status.state.charAt(0).toUpperCase() + status.state.slice(1)}\${status.message ? `: \${status.message}` : ''}</span>
          </div>
          \${status.valid_until ? `<div class="availeasy-message">Until: \${new Date(status.valid_until).toLocaleString('en-US', { timeZone: userTimezone, hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short' })}</div>` : ''}
          \${windows.length > 0 && windows[0].state === 'available' ? `
            <div class="availeasy-next-window">
              Next available: \${new Date(windows[0].start).toLocaleString('en-US', { timeZone: userTimezone, hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short' })} - \${new Date(windows[0].end).toLocaleString('en-US', { timeZone: userTimezone, hour: 'numeric', minute: 'numeric' })}
            </div>
          ` : `
            <div class="availeasy-next-window">
              Next available: No upcoming availability
            </div>
          `}
          <div class="availeasy-timezone">Timezone: \${userTimezone}</div>
        `;
      };

      fetch(`/\${handle}/availability.json`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: \${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          renderWidget(data);
        })
        .catch(error => {
          console.error('Error fetching availability data:', error);
          rootDiv.innerHTML = '<div class="availeasy-widget">Failed to load availability.</div>';
        });
    })();
  `;

  const headers = new Headers();
  headers.set("Content-Type", "application/javascript");
  headers.set("Cache-Control", "public, max-age=3600");

  return new NextResponse(scriptContent, {
    status: 200,
    headers,
  });
}
