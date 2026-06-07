import { NextRequest, NextResponse } from "next/server";
import { findUserByHandle } from "@/lib/repositories/user";
import { getCurrentStatusByUserId } from "@/lib/repositories/currentStatus";
import { CurrentStatusState } from "@prisma/client";

// Helper function to generate SVG
const generateSvgBadge = (statusText: string, color: string) => `
  <svg width="120" height="20" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="120" height="20" fill="${color}" rx="3" />
    <text x="60" y="14" font-family="Verdana, Geneva, sans-serif" font-size="10" fill="#fff" text-anchor="middle">
      ${statusText}
    </text>
  </svg>
`;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;

  // 1. Fetch User by handle
  const user = await findUserByHandle(handle);
  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  // 2. Get current status
  const currentStatus = await getCurrentStatusByUserId(user.id);

  let statusState: CurrentStatusState = CurrentStatusState.offline;
  let statusMessage: string | null = null;

  const now = new Date();
  if (currentStatus && (!currentStatus.validUntil || currentStatus.validUntil > now)) {
    statusState = currentStatus.state;
    statusMessage = currentStatus.message;
  }

  let color = "#64748b"; // Default: Offline/Grey
  switch (statusState) {
    case CurrentStatusState.available:
      color = "#10b981"; // Green
      break;
    case CurrentStatusState.busy:
      color = "#ef4444"; // Red
      break;
    case CurrentStatusState.away:
      color = "#f59e0b"; // Orange
      break;
    case CurrentStatusState.custom:
      color = "#6366f1"; // Indigo
      break;
    case CurrentStatusState.offline:
    default:
      color = "#64748b"; // Grey
      break;
  }

  const badgeText = `availability: ${statusMessage || statusState}`;
  const svg = generateSvgBadge(badgeText, color);

  const headers = new Headers();
  headers.set("Content-Type", "image/svg+xml");
  headers.set("Cache-Control", "public, max-age=60");

  return new NextResponse(svg, {
    status: 200,
    headers,
  });
}
