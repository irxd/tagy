/** Live preview beside the form. The rendered template arrives in step 4. */
export function PreviewPane(_props: {
  expanded: boolean
  onExpandedChange: (open: boolean) => void
}) {
  return (
    <div className="flex w-[440px] shrink-0 items-center justify-center rounded-tile-lg bg-linear-to-b from-[#e9ecf1] to-[#dce1e8] text-sm text-tile-muted">
      Preview
    </div>
  )
}
