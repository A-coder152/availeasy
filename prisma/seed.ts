import { PrismaClient, AvailabilityState, CurrentStatusState, ExceptionSource } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      handle: 'demo',
      timezone: 'America/Toronto',
      name: 'Demo User',
    },
  });

  // Create Availability Rules
  const rules = [
    { dayOfWeek: 1, startTimeLocal: '09:00', endTimeLocal: '12:00', state: AvailabilityState.available, priority: 0, timezone: 'America/Toronto' },
    { dayOfWeek: 1, startTimeLocal: '13:00', endTimeLocal: '17:00', state: AvailabilityState.available, priority: 0, timezone: 'America/Toronto' },
    { dayOfWeek: 2, startTimeLocal: '09:00', endTimeLocal: '12:00', state: AvailabilityState.available, priority: 0, timezone: 'America/Toronto' },
    { dayOfWeek: 2, startTimeLocal: '13:00', endTimeLocal: '17:00', state: AvailabilityState.available, priority: 0, timezone: 'America/Toronto' },
    { dayOfWeek: 3, startTimeLocal: '09:00', endTimeLocal: '12:00', state: AvailabilityState.available, priority: 0, timezone: 'America/Toronto' },
    { dayOfWeek: 3, startTimeLocal: '13:00', endTimeLocal: '17:00', state: AvailabilityState.available, priority: 0, timezone: 'America/Toronto' },
    { dayOfWeek: 4, startTimeLocal: '09:00', endTimeLocal: '12:00', state: AvailabilityState.available, priority: 0, timezone: 'America/Toronto' },
    { dayOfWeek: 4, startTimeLocal: '13:00', endTimeLocal: '17:00', state: AvailabilityState.available, priority: 0, timezone: 'America/Toronto' },
    { dayOfWeek: 5, startTimeLocal: '09:00', endTimeLocal: '12:00', state: AvailabilityState.available, priority: 0, timezone: 'America/Toronto' },
    { dayOfWeek: 5, startTimeLocal: '13:00', endTimeLocal: '17:00', state: AvailabilityState.available, priority: 0, timezone: 'America/Toronto' },
  ];

  for (const rule of rules) {
    await prisma.availabilityRule.create({
      data: { ...rule, userId: user.id },
    });
  }

  // Create Current Status
  await prisma.currentStatus.upsert({
    where: { userId: user.id },
    update: {
      state: CurrentStatusState.available,
      message: 'Available for calls',
    },
    create: {
      userId: user.id,
      state: CurrentStatusState.available,
      message: 'Available for calls',
    },
  });

  // Create Exception
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const start = new Date(tomorrow);
  start.setHours(14, 0, 0, 0);
  const end = new Date(tomorrow);
  end.setHours(15, 0, 0, 0);

  await prisma.availabilityException.create({
    data: {
      userId: user.id,
      startsAt: start,
      endsAt: end,
      state: AvailabilityState.unavailable,
      publicLabel: 'Busy',
      privateNote: 'Private appointment',
      source: ExceptionSource.manual,
    },
  });

  console.log('Seed data created successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
