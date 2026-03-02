"use client";

import {
  Chip,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { TaskForm } from "@/components/tasks/task-form";
import { AppDialog } from "@/components/ui/app-dialog";
import { AppDrawer } from "@/components/ui/app-drawer";
import { useAppSnackbar } from "@/components/ui/app-snackbar-provider";
import type { TaskFormState, TaskFormValues } from "@/lib/tasks/types";

interface TasksUxShellProps {
  createAction: (
    previousState: TaskFormState,
    formData: FormData,
  ) => Promise<TaskFormState>;
  defaultValues: TaskFormValues;
}

/**
 * Phase-1 UX shell that introduces accessible dialog/drawer primitives
 * while keeping existing task creation flow intact.
 */
export function TasksUxShell({ createAction, defaultValues }: TasksUxShellProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const { enqueueSnackbar } = useAppSnackbar();

  function openCreateModal() {
    setIsCreateModalOpen(true);
    enqueueSnackbar("Create dialog opened.", { severity: "info" });
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false);
  }

  function openInfoDrawer() {
    setIsInfoDrawerOpen(true);
  }

  function closeInfoDrawer() {
    setIsInfoDrawerOpen(false);
  }

  return (
    <>
      <Paper
        sx={{
          p: 2.5,
          background:
            "linear-gradient(120deg, rgba(15,118,110,0.09), rgba(20,184,166,0.14))",
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" color="primary" label="Fast create" />
            <Chip size="small" color="success" label="Keyboard-friendly" />
            <Chip size="small" color="warning" label="In-place workflow" />
          </Stack>

          <Typography variant="h6" component="h2" fontWeight={700}>
            Task command center
          </Typography>
          <Typography color="text.secondary">
            Create tasks from a focused modal and keep guidance in the side
            drawer without leaving the page.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="contained" onClick={openCreateModal}>
              New task modal
            </Button>
            <Button variant="outlined" onClick={openInfoDrawer}>
              Productivity tips
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <AppDialog
        open={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Create task"
        description="This modal currently renders the same full task form as the inline flow."
      >
        <TaskForm
          action={createAction}
          initialValues={defaultValues}
          submitLabel="Create task"
        />
      </AppDialog>

      <AppDrawer
        open={isInfoDrawerOpen}
        onClose={closeInfoDrawer}
        title="Drawer primitive"
        description="Reusable in-place container for edit/create flows with focus-trapped modal behavior."
      >
        <Stack spacing={1.5}>
          <Typography color="text.secondary">
            Keep tasks crisp. A strong starter step should be small enough to
            begin in under two minutes.
          </Typography>
          <Typography color="text.secondary">
            Add checklist items only when the sequence matters. Use tips for
            friction points you often hit.
          </Typography>
          <Button variant="contained" onClick={closeInfoDrawer}>
            Close drawer
          </Button>
        </Stack>
      </AppDrawer>
    </>
  );
}
