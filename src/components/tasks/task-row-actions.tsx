"use client";

import { useState, useTransition } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
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
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button href={`/app/tasks/${taskId}`} variant="outlined" size="small">
          View
        </Button>

        <Button href={`/app/tasks/${taskId}/edit`} variant="outlined" size="small">
          Edit
        </Button>

        <Button
          variant="outlined"
          color="warning"
          size="small"
          disabled={isPending}
          onClick={() => setConfirmIntent("archive")}
        >
          Archive
        </Button>

        <Button
          variant="outlined"
          color="error"
          size="small"
          disabled={isPending}
          sx={{ color: "error.main", borderColor: "error.main" }}
          onClick={() => setConfirmIntent("delete")}
        >
          Delete
        </Button>
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Chip
      size="small"
      color="warning"
      label={isPending ? "Unarchiving..." : "Archived"}
      clickable
      onClick={() =>
        startTransition(async () => {
          await unarchiveTaskAction(taskId);
          router.refresh();
        })
      }
    />
  );
}
