import {
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { PickAction } from "@prisma/client";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSection } from "@/components/ui/list-section";
import { PagePurposeHeader } from "@/components/ui/page-purpose-header";
import { StatusBadgeCluster } from "@/components/ui/status-badge-cluster";
import { requireSessionUserId } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

const MAX_ACTIVITY_ITEMS = 10;

/**
 * Shows account details, user-scoped activity logs, and authenticated password management.
 */
export default async function UserPage() {
  const userId = await requireSessionUserId();

  const [user, recentPickEvents, recentAiRequests] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true,
            intents: true,
            pickEvents: true,
            aiStarterStepRequests: true,
            passwordResetTokens: true,
          },
        },
      },
    }),
    prisma.pickEvent.findMany({
      where: { userId },
      orderBy: { pickedAt: "desc" },
      take: MAX_ACTIVITY_ITEMS,
      include: {
        task: {
          select: { title: true },
        },
      },
    }),
    prisma.aiStarterStepRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ACTIVITY_ITEMS,
      include: {
        task: {
          select: { title: true },
        },
      },
    }),
  ]);

  if (!user) {
    return (
      <Stack spacing={3}>
        <PagePurposeHeader
          title="User"
          subtitle="Manage account details and review your activity timeline."
        />
        <ListSection title="Account summary">
          <EmptyState
            title="Unable to load user profile"
            description="The account summary is unavailable right now."
          />
        </ListSection>
      </Stack>
    );
  }

  return (
    <Stack spacing={3.5}>
      <PagePurposeHeader
        title="User"
        subtitle="Manage account details, review activity logs, and update your password."
      />

      <ListSection
        title="Account summary"
        subtitle="Core profile details and usage totals for this workspace."
      >
        <Stack spacing={2.25}>
          <Typography sx={{ fontSize: { xs: "1rem", sm: "1.08rem" } }}>
            <strong>Email:</strong> {user.email}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap>
            <Typography color="text.secondary">
              Created: {user.createdAt.toLocaleString()}
            </Typography>
            <Typography color="text.secondary">
              Last updated: {user.updatedAt.toLocaleString()}
            </Typography>
          </Stack>
          <StatusBadgeCluster>
            <Chip label={`Tasks: ${user._count.tasks}`} />
            <Chip label={`Intents: ${user._count.intents}`} />
            <Chip label={`Events: ${user._count.pickEvents}`} />
            <Chip label={`AI requests: ${user._count.aiStarterStepRequests}`} />
            <Chip label={`Reset requests: ${user._count.passwordResetTokens}`} />
          </StatusBadgeCluster>
        </Stack>
      </ListSection>

      <ListSection
        title="Change password"
        subtitle="Update your credentials without leaving the app workspace."
      >
        <ChangePasswordForm />
      </ListSection>

      <ListSection
        title="Recent pick activity"
        subtitle="The latest outcomes recorded from the task picker."
      >
        <Stack spacing={2}>
          {recentPickEvents.length === 0 ? (
            <EmptyState
              title="No pick events yet"
              description="Once you start using the picker, outcomes will appear here."
            />
          ) : (
            recentPickEvents.map((event) => (
              <Stack
                key={event.id}
                spacing={1}
                sx={{
                  borderRadius: 4,
                  px: { xs: 1.5, sm: 2 },
                  py: 1.75,
                  bgcolor: "color-mix(in srgb, var(--mui-palette-background-paper) 82%, transparent)",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip
                    size="small"
                    label={event.action}
                    color={event.action === PickAction.DONE ? "success" : "default"}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {event.pickedAt.toLocaleString()}
                  </Typography>
                </Stack>
                <Typography fontWeight={600}>{event.task.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.why}
                </Typography>
              </Stack>
            ))
          )}
        </Stack>
      </ListSection>

      <ListSection
        title="Recent AI generation requests"
        subtitle="The latest AI-assisted starter-step generation activity."
      >
        <Stack spacing={2}>
          {recentAiRequests.length === 0 ? (
            <EmptyState
              title="No AI request logs yet"
              description="AI generation activity will appear here after new requests are made."
            />
          ) : (
            recentAiRequests.map((request) => (
              <Stack
                key={request.id}
                spacing={1}
                sx={{
                  borderRadius: 4,
                  px: { xs: 1.5, sm: 2 },
                  py: 1.75,
                  bgcolor: "color-mix(in srgb, var(--mui-palette-background-paper) 82%, transparent)",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography fontWeight={600}>{request.task.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {request.createdAt.toLocaleString()}
                </Typography>
                <Typography variant="body2">{request.generatedStep}</Typography>
              </Stack>
            ))
          )}
        </Stack>
      </ListSection>
    </Stack>
  );
}
