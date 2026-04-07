import prisma from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/auth/session";
import { HomeDashboardShell } from "@/components/tasks/home-dashboard-shell";

export default async function AppHomePage() {
  const userId = await requireSessionUserId();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [activeTasksCount, archivedTasksCount, eventsCount, completedTodayCount, recentEvents] = await Promise.all([
    prisma.task.count({ where: { userId, isArchived: false } }),
    prisma.task.count({ where: { userId, isArchived: true } }),
    prisma.pickEvent.count({ where: { userId } }),
    prisma.pickEvent.count({
      where: {
        userId,
        action: "DONE",
        pickedAt: { gte: startOfToday },
      },
    }),
    prisma.pickEvent.findMany({
      where: { userId },
      orderBy: { pickedAt: "desc" },
      take: 8,
      select: {
        id: true,
        action: true,
        pickedAt: true,
        why: true,
        task: {
          select: {
            title: true,
          },
        },
      },
    }),
  ]);

  const focusStreakDays = computeFocusStreak(
    recentEvents.map((event) => event.pickedAt),
    startOfToday,
  );
  const recentActivity = recentEvents.slice(0, 4).map((event) => ({
    id: event.id,
    title: event.task.title,
    action: event.action,
    pickedAtLabel: formatRelativeLabel(event.pickedAt, startOfToday),
    why: event.why,
  }));

  return (
    <HomeDashboardShell
      activeTasksCount={activeTasksCount}
      archivedTasksCount={archivedTasksCount}
      eventsCount={eventsCount}
      completedTodayCount={completedTodayCount}
      focusStreakDays={focusStreakDays}
      recentActivity={recentActivity}
    />
  );
}

function computeFocusStreak(eventDates: Date[], today: Date): number {
  const uniqueDays = new Set(
    eventDates.map((date) => date.toISOString().slice(0, 10)),
  );
  let streak = 0;
  const cursor = new Date(today);

  while (uniqueDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function formatRelativeLabel(date: Date, today: Date): string {
  const startOfTarget = new Date(date);
  startOfTarget.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (today.getTime() - startOfTarget.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "1D AGO";
  }

  return `${diffDays}D AGO`;
}
