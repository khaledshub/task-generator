import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { JoinAsGuestSection } from "@/components/auth/join-as-guest-section";
import { PublicHeader } from "@/components/navigation/public-header";
import { AppShell } from "@/components/ui/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionPanel, FeaturePanel } from "@/components/ui/surface-panel";
import { getBootstrapProbeStatus } from "@/lib/bootstrap/service";

export default async function HomePage() {
  const probe = await getBootstrapProbeStatus();

  return (
    <AppShell header={<PublicHeader />} fullBleed>
      <Box
        sx={{
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 2, sm: 3, lg: 4 },
          maxWidth: 1380,
          mx: "auto",
          display: "grid",
          gap: { xs: 3, lg: 4.5 },
        }}
      >
        <FeaturePanel
          tone="spotlight"
          padding={{ xs: 3, sm: 4.5, lg: 5.5 }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.05fr) minmax(360px, 0.95fr)" },
              gap: { xs: 4, lg: 5 },
              alignItems: "center",
              minHeight: { lg: "70svh" },
            }}
          >
            <Stack spacing={3}>
              <Stack spacing={1.75}>
                <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.72)", letterSpacing: "0.22em" }}>
                  Celestial Navigator
                </Typography>
                <Typography variant="h1" component="h1" sx={{ maxWidth: 760, fontSize: { xs: "3rem", sm: "4rem", lg: "5.2rem" }, lineHeight: 0.94 }}>
                  Your weighted{" "}
                  <Box component="span" sx={{ color: "secondary.main" }}>
                    next-action
                  </Box>{" "}
                  picker for maximum focus.
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.84)", maxWidth: 620, fontSize: { xs: "1rem", sm: "1.08rem" } }}>
                  Keep the current task architecture you rely on, then let the app surface one credible next move based on context, energy, and time.
                </Typography>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button href="/signup" variant="contained" color="inherit">
                  Create account
                </Button>
                <Button href="/login" variant="outlined" sx={{ color: "common.white", borderColor: "rgba(255,255,255,0.4)" }}>
                  Log in
                </Button>
                <JoinAsGuestSection />
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label="Weighted picking" color="primary" size="small" />
                <Chip label="AI starter steps" color="secondary" size="small" />
                <Chip label="History tracking" size="small" />
              </Stack>
            </Stack>

            <ActionPanel
              title="System status"
              description="The app remains wired for auth, Prisma, PostgreSQL, AI starter-step generation, and route-level task workflows."
              padding={{ xs: 3, sm: 3.5 }}
            >
              <Stack spacing={2.5}>
                {probe ? (
                  <Alert severity="success">
                    Connectivity probe found: <strong>{probe.key}</strong> at{" "}
                    {new Date(probe.updatedAt).toLocaleString()}
                  </Alert>
                ) : (
                  <Alert severity="warning">
                    Connectivity probe not found yet. Run <code>npm run db:seed</code> after migrations.
                  </Alert>
                )}

                <Stack spacing={1.5}>
                  <StatLine label="Current stack" value="Next.js, Prisma, Postgres, NextAuth" />
                  <StatLine label="Primary workflow" value="Create, pick, act, review" />
                  <StatLine label="Behavior preserved" value="Existing options and task logic remain intact" />
                </Stack>

                <Button href="/" variant="text" sx={{ alignSelf: "flex-start", color: "common.white" }}>
                  Refresh status
                </Button>
              </Stack>
            </ActionPanel>
          </Box>
        </FeaturePanel>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" },
            gap: { xs: 3, lg: 4 },
          }}
        >
          <FeaturePanel
            title="How it works"
            description="Build a task pool once, then let the app surface a best-fit action instead of another list to triage."
          >
            <Stack spacing={1.5} component="ol" sx={{ m: 0, pl: 2.5 }}>
              <Typography component="li" color="text.secondary">
                Add tasks with context, energy, frequency, and time estimate.
              </Typography>
              <Typography component="li" color="text.secondary">
                Generate starter steps and tips when a task needs help getting unstuck.
              </Typography>
              <Typography component="li" color="text.secondary">
                Pick one action based on your current conditions, then record the outcome.
              </Typography>
            </Stack>
          </FeaturePanel>

          <FeaturePanel
            title="Why this redesign helps"
            description="The new UI adds stronger orientation without changing the current data model, routes, or task decision logic."
          >
            <Stack spacing={1.5}>
              <Typography color="text.secondary">
                A larger hero and clearer command surfaces make the next action obvious faster.
              </Typography>
              <Typography color="text.secondary">
                Dense operator pages stay readable through calmer sections instead of dashboard-card overload.
              </Typography>
              <Typography color="text.secondary">
                Shared shells make it easier to keep future UI changes consistent across the product.
              </Typography>
            </Stack>
          </FeaturePanel>
        </Box>

        <FeaturePanel tone="neutral">
          <EmptyState
            title="Ready to make the app useful?"
            description="Create a workspace or join as guest to start building the task pool the picker can act on."
            actions={
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button href="/signup" variant="contained">Create workspace</Button>
                <JoinAsGuestSection />
              </Stack>
            }
          />
        </FeaturePanel>
      </Box>
    </AppShell>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Typography sx={{ color: "rgba(255,255,255,0.62)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.76rem" }}>
          {label}
        </Typography>
        <Typography sx={{ color: "common.white", fontWeight: 700, textAlign: "right" }}>
          {value}
        </Typography>
      </Stack>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
    </Stack>
  );
}
