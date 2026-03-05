import { Paper, Stack, Typography } from "@mui/material";

interface PagePurposeHeaderProps {
  title: string;
  subtitle: string;
}

export function PagePurposeHeader({ title, subtitle }: PagePurposeHeaderProps) {
  return (
    <Paper
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 3,
        background:
          "linear-gradient(130deg, color-mix(in srgb, var(--mui-palette-primary-main) 12%, transparent), color-mix(in srgb, var(--mui-palette-secondary-main) 9%, transparent), color-mix(in srgb, var(--mui-palette-background-paper) 92%, white 8%))",
      }}
    >
      <Stack spacing={0.5} alignItems="center" textAlign="center">
        <Typography variant="h6" component="h1" fontWeight={700} textAlign="center">
          {title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="center"
          sx={{ fontSize: { xs: "0.72rem", sm: "0.76rem" }, maxWidth: 760 }}
        >
          {subtitle}
        </Typography>
      </Stack>
    </Paper>
  );
}
