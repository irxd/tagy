import { DatabaseBackup, Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  BackupError,
  createBackup,
  markBackedUp,
  parseBackup,
  restoreBackup,
  type ParsedBackup,
} from '@/db/backup'
import { formatDate, todayISO } from '@/domain/dates'
import { saveFile } from '@/lib/saveFile'
import { Button } from '@/ui/Button'
import { ConfirmDialog } from '@/ui/Overlay'
import { useToast } from '@/ui/toastContext'

/**
 * Export backup / Import backup, usable anywhere: `exportNow` saves the
 * JSON file; `pickImport` opens the file picker, validates the file and
 * asks before replacing everything. Render `element` once where it's used.
 */
export function useBackup() {
  const toast = useToast()
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<ParsedBackup | null>(null)
  const [busy, setBusy] = useState(false)

  async function exportNow() {
    setBusy(true)
    try {
      const file = await createBackup()
      saveFile(
        new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }),
        `tagy-backup-${todayISO()}.json`,
      )
      await markBackedUp(file.exportedAt)
      toast({ message: 'Backup saved — keep the file somewhere safe' })
    } catch {
      toast({ message: "Couldn't make the backup — try again" })
    } finally {
      setBusy(false)
    }
  }

  async function onFile(file: File | undefined) {
    if (input.current) input.current.value = ''
    if (!file) return
    try {
      setPending(parseBackup(await file.text()))
    } catch (error) {
      toast({
        message: error instanceof BackupError ? error.message : "Couldn't read that file.",
      })
    }
  }

  const summary = pending?.summary
  const element = (
    <>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {pending && summary && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setPending(null)}
          icon={DatabaseBackup}
          title="Replace everything with this backup?"
          description={`${summary.invoices} invoice${summary.invoices === 1 ? '' : 's'} and ${summary.clients} client${summary.clients === 1 ? '' : 's'}${summary.business ? ` from ${summary.business}` : ''}, saved ${formatDate(summary.exportedAt.slice(0, 10))}. Everything in this browser now will be replaced.`}
          confirmLabel="Replace and import"
          confirmIcon={Upload}
          confirmVariant="dark"
          onConfirm={async () => {
            try {
              await restoreBackup(pending.file)
              navigate('/')
              toast({
                message: `Imported ${summary.invoices} invoices and ${summary.clients} clients`,
              })
            } catch {
              toast({ message: 'Import failed — nothing was changed' })
            }
          }}
        >
          <Button
            icon={Download}
            onClick={() => void exportNow()}
            disabled={busy}
            className="w-fit"
          >
            Export current data first
          </Button>
        </ConfirmDialog>
      )}
    </>
  )

  return { exportNow, pickImport: () => input.current?.click(), element, busy }
}
