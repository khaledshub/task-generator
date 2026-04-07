"use client";

import { useState, useTransition } from "react";
import {
  ArchiveOutlined,
  DeleteOutline,
  EditOutlined,
  OpenInNew,
  UnarchiveOutlined,
} from "@mui/icons-material";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import {
  archiveTaskAction,
  deleteTaskAction,
  unarchiveTaskAction,
} from "@/app/app/tasks/actions";

interface TaskRowActionsProps {
  taskId: string;
}

type ConfirmIntent = "archive" | "delete" | null;

export function TaskRowActions({ taskId }: TaskRowActionsProps) {
  const theme = useTheme();
  const router = useRouter();
  const [confirmIntent, setConfirmIntent] = useState<ConfirmIntent>(null);
  const [isPending, startTransition] = useTransition();

  const isConfirmOpen = confirmIntent !== null;

  function onConfirmAction() {
    if (confirmIntent === null) {
      return;
    }

    const action = confirmIntent;
    startTransition(async () => {
      if (action === "archive") {
        await archiveTaskAction(taskId);
      } else {
        await deleteTaskAction(taskId);
      }
      setConfirmIntent(null);
      router.refresh();
    });
  }

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          href={`/app/tasks/${taskId}`}
          variant="contained"
          size="small"
          endIcon={<OpenInNew fontSize="small" />}
          sx={{
            minWidth: 0,
            px: 1.8,
          }}
        >
          Open
        </Button>

        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            p: 0.5,
            borderRadius: 999,
            bgcolor: alpha(theme.palette.common.white, 0.04),
            border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
          }}
        >
          <Tooltip title="Edit task">
            <span>
              <IconButton
                href={`/app/tasks/${taskId}/edit`}
                size="small"
                aria-label="Edit task"
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    color: "text.primary",
                    bgcolor: alpha(theme.palette.common.white, 0.06),
                  },
                }}
              >
                <EditOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Archive task">
            <span>
              <IconButton
                size="small"
                aria-label="Archive task"
                disabled={isPending}
                onClick={() => setConfirmIntent("archive")}
                sx={{
                  color: alpha(theme.palette.warning.main, 0.92),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.warning.main, 0.12),
                  },
                }}
              >
                <ArchiveOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Delete task">
            <span>
              <IconButton
                size="small"
                aria-label="Delete task"
                disabled={isPending}
                onClick={() => setConfirmIntent("delete")}
                sx={{
                  color: alpha(theme.palette.error.main, 0.92),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.error.main, 0.12),
                  },
                }}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Dialog open={isConfirmOpen} onClose={() => setConfirmIntent(null)}>
        <DialogTitle>
          {confirmIntent === "archive" ? "Archive task?" : "Delete task?"}
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {confirmIntent === "archive"
              ? "This task will move to Recently archived and can be restored."
              : "This will permanently remove the task and cannot be undone."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmIntent(null)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={onConfirmAction}
            color={confirmIntent === "delete" ? "error" : "warning"}
            variant="contained"
            disabled={isPending}
          >
            {isPending
              ? "Working..."
              : confirmIntent === "archive"
                ? "Confirm archive"
                : "Confirm delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

interface ArchivedStatusChipProps {
  taskId: string;
}

export function ArchivedStatusChip({ taskId }: ArchivedStatusChipProps) {
  const theme = useTheme();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Tooltip title="Restore task to the active pool">
      <Chip
        icon={<UnarchiveOutlined sx={{ fontSize: "0.95rem !important" }} />}
        size="small"
        label={isPending ? "Restoring..." : "Restore"}
        clickable
        onClick={() =>
          startTransition(async () => {
            await unarchiveTaskAction(taskId);
            router.refresh();
          })
        }
        sx={{
          bgcolor: alpha(theme.palette.warning.main, 0.12),
          color: theme.palette.warning.main,
          fontWeight: 700,
        }}
      />
    </Tooltip>
  );
}
