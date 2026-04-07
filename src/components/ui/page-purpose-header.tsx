import { PageIntro } from "@/components/ui/page-intro";
import type { SxProps, Theme } from "@mui/material/styles";

interface PagePurposeHeaderProps {
  title: string;
  subtitle: string;
  panelSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
}

export function PagePurposeHeader({
  title,
  subtitle,
  panelSx,
  contentSx,
}: PagePurposeHeaderProps) {
  return <PageIntro title={title} subtitle={subtitle} panelSx={panelSx} contentSx={contentSx} />;
}
