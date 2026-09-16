/**
 * Shared typography scale for hierarchical, readable text.
 *
 * H1 — page title (PageTitle)
 * H2 — major sections (SectionHeading)
 * H3 — subsections / card titles (SubsectionHeading)
 * Body — default readable copy (16px, relaxed line-height)
 */
export const TYPOGRAPHY = {
    h1: 'text-foreground text-3xl font-bold tracking-tight leading-tight',
    h2: 'text-foreground text-2xl font-semibold tracking-tight leading-snug',
    h3: 'text-foreground text-lg font-semibold tracking-tight leading-snug',
    body: 'text-base font-normal leading-relaxed',
    bodyMuted: 'text-muted-foreground text-base font-normal leading-relaxed',
    small: 'text-sm font-normal leading-relaxed',
} as const;
