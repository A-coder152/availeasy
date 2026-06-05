import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth/server-utils";
import { idSchema } from "@/lib/availability/validation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // This API is for dashboard use, so only session authentication is needed.
  // No API token authentication for this specific endpoint as it's for fetching
  // data tied directly to the logged-in user for the UI.
  const { userId } = await authenticateRequest(req);

  if (!userId) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const parseResult = idSchema.safeParse(id);
  if (!parseResult.success) {
    return new NextResponse("Invalid user ID", { status: 400 });
  }

  const requestedUserId = parseResult.data;

  // Ensure the logged-in user is requesting their own data
  if (userId !== requestedUserId) {
    return unauthorizedResponse("You can only access your own user data.");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: requestedUserId },
      include: {
        AvailabilityRule: true,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Filter out sensitive fields if necessary (though for dashboard, most are fine)
    const { email, ...publicUser } = user;

    return NextResponse.json(publicUser, { status: 200 });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
