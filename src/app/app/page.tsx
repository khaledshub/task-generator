import prisma from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/auth/session";
import { HomeDashboardShell } from "@/components/tasks/home-dashboard-shell";

export default async function AppHomePage() {
  const userId = await requireSessionUserId();

  const [activeTasksCount, archivedTasksCount, eventsCount] = await Promise.all([
    prisma.task.count({ where: { userId, isArchived: false } }),
    prisma.task.count({ where: { userId, isArchived: true } }),
    prisma.pickEvent.count({ where: { userId } }),
  ]);

  return (
    <HomeDashboardShell
      activeTasksCount={activeTasksCount}
      archivedTasksCount={archivedTasksCount}
      eventsCount={eventsCount}
    />
  );
}
