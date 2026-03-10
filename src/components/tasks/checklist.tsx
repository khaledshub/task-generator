"use client";

import { Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import { useCallback, useMemo, useSyncExternalStore } from "react";

interface ChecklistProps {
  items: string[];
  emptyMessage: string;
  storageKey?: string;
}

type CheckedState = Record<string, boolean>;
const CHECKLIST_STORAGE_EVENT = "task-checklist-storage-updated";
const EMPTY_CHECKED_STATE: CheckedState = {};
const checklistSnapshotCache = new Map<string, { raw: string | null; state: CheckedState }>();

export function Checklist({ items, emptyMessage, storageKey }: ChecklistProps) {
  const normalizedItems = useMemo(
    () => items.map((item) => item.trim()).filter((item) => item.length > 0),
    [items],
  );

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined") {
        return () => undefined;
      }

      const handleChange = (event: Event) => {
        if (event.type === "storage") {
          const storageEvent = event as StorageEvent;
          if (storageEvent.key && storageEvent.key !== storageKey) {
            return;
          }
        }

        if (event.type === CHECKLIST_STORAGE_EVENT) {
          const customEvent = event as CustomEvent<string | undefined>;
          if (customEvent.detail && customEvent.detail !== storageKey) {
            return;
          }
        }

        onStoreChange();
      };

      window.addEventListener("storage", handleChange);
      window.addEventListener(CHECKLIST_STORAGE_EVENT, handleChange as EventListener);

      return () => {
        window.removeEventListener("storage", handleChange);
        window.removeEventListener(CHECKLIST_STORAGE_EVENT, handleChange as EventListener);
      };
    },
    [storageKey],
  );

  const checkedState = useSyncExternalStore(
    subscribe,
    () => getChecklistSnapshot(storageKey),
    () => EMPTY_CHECKED_STATE,
  );

  const updateCheckedState = useCallback(
    (item: string, checked: boolean) => {
      if (!storageKey || typeof window === "undefined") {
        return;
      }

      const nextState: CheckedState = {
        ...getChecklistSnapshot(storageKey),
        [item]: checked,
      };
      const raw = JSON.stringify(nextState);
      window.localStorage.setItem(storageKey, raw);
      checklistSnapshotCache.set(storageKey, { raw, state: nextState });
      window.dispatchEvent(new CustomEvent(CHECKLIST_STORAGE_EVENT, { detail: storageKey }));
    },
    [storageKey],
  );

  if (normalizedItems.length === 0) {
    if (!emptyMessage.trim()) {
      return null;
    }

    return <Typography color="text.secondary">{emptyMessage}</Typography>;
  }

  const checkedCount = normalizedItems.filter((item) => checkedState[item]).length;

  return (
    <Stack spacing={1}>
      <Typography variant="body2" color="text.secondary">
        {checkedCount}/{normalizedItems.length} completed
      </Typography>
      <Stack>
        {normalizedItems.map((item) => (
          <FormControlLabel
            key={item}
            control={
              <Checkbox
                checked={Boolean(checkedState[item])}
                onChange={(event) => updateCheckedState(item, event.target.checked)}
              />
            }
            label={item}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function getChecklistSnapshot(storageKey?: string): CheckedState {
  if (!storageKey || typeof window === "undefined") {
    return EMPTY_CHECKED_STATE;
  }

  const raw = window.localStorage.getItem(storageKey);
  const cachedSnapshot = checklistSnapshotCache.get(storageKey);
  if (cachedSnapshot && cachedSnapshot.raw === raw) {
    return cachedSnapshot.state;
  }

  if (!raw) {
    checklistSnapshotCache.set(storageKey, { raw: null, state: EMPTY_CHECKED_STATE });
    return EMPTY_CHECKED_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const nextState: CheckedState = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "boolean") {
          nextState[key] = value;
        }
      }
      checklistSnapshotCache.set(storageKey, { raw, state: nextState });
      return nextState;
    }
  } catch {
    // Ignore malformed local storage and start fresh.
  }

  checklistSnapshotCache.set(storageKey, { raw, state: EMPTY_CHECKED_STATE });
  return EMPTY_CHECKED_STATE;
}
