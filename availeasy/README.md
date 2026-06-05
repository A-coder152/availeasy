# Availeasy - Personal Availability Service

Availeasy is an API-first personal availability service.

## Prerequisites

- Node.js (v18+)
- PostgreSQL

## Getting Started

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure environment:**
    Copy `.env.example` to `.env` and set your `DATABASE_URL` (PostgreSQL), `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`.
    **Note: Do not commit your `.env` file.**
4.  **Database Setup:**
    ```bash
    npx prisma migrate dev --name init
    npx prisma db seed
    ```
5.  **Run development server:**
    ```bash
    npm run dev
    ```

## API Usage

- **Fetch Availability:**
  `curl "http://localhost:3000/u/demo/availability.json"`
- **Fetch Status:**
  `curl "http://localhost:3000/u/demo/status.json"`
- **Update Status:**
  `curl -X PUT "http://localhost:3000/api/v1/me/status" -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d '{"state": "busy", "message": "Deep work", "valid_until": "2026-06-04T15:00:00Z"}'`

## Website Embed

Include this snippet on your site:
```html
<div id="availability-widget" data-user="yourhandle"></div>
<script src="https://yourdomain.com/u/yourhandle/embed.js"></script>
```

## Testing

Run tests with Vitest:
```bash
npm test
```
