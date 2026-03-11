import {
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { PickAction } from "@prisma/client";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { PagePurposeHeader } from "@/components/ui/page-purpose-header";
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
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">Unable to load user profile.</Typography>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <PagePurposeHeader
        title="User"
        subtitle="Manage account details, review activity logs, and update your password."
      />

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Account summary</Typography>
          <Typography>
            <strong>Email:</strong> {user.email}
          </Typography>
          <Typography color="text.secondary">
            Created: {user.createdAt.toLocaleString()}
          </Typography>
          <Typography color="text.secondary">
            Last updated: {user.updatedAt.toLocaleString()}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`Tasks: ${user._count.tasks}`} />
            <Chip label={`Intents: ${user._count.intents}`} />
            <Chip label={`Events: ${user._count.pickEvents}`} />
            <Chip label={`AI requests: ${user._count.aiStarterStepRequests}`} />
            <Chip label={`Reset requests: ${user._count.passwordResetTokens}`} />
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Change password</Typography>
          <ChangePasswordForm />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Recent pick activity</Typography>
          {recentPickEvents.length === 0 ? (
            <Typography color="text.secondary">No pick events yet.</Typography>
          ) : (
            recentPickEvents.map((event) => (
              <Stack key={event.id} spacing={1}>
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
                <Divider />
              </Stack>
            ))
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Recent AI generation requests</Typography>
          {recentAiRequests.length === 0 ? (
            <Typography color="text.secondary">No AI request logs yet.</Typography>
          ) : (
            recentAiRequests.map((request) => (
              <Stack key={request.id} spacing={1}>
                <Typography fontWeight={600}>{request.task.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {request.createdAt.toLocaleString()}
                </Typography>
                <Typography variant="body2">{request.generatedStep}</Typography>
                <Divider />
              </Stack>
            ))
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
