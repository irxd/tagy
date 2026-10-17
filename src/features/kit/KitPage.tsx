import {
  CircleCheck,
  Copy,
  Download,
  Ellipsis,
  FileText,
  Mail,
  PencilLine,
  Plus,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { DisplayStatus } from '@/domain/status'
import { Button, IconButton } from '@/ui/Button'
import { Chip, DropdownButton, FilterPill, MiniChip } from '@/ui/Chip'
import { Figure, Party, Stat } from '@/ui/Data'
import { DateField, SelectField, TextAreaField, TextField } from '@/ui/Field'
import { Menu, MenuDivider, MenuItem } from '@/ui/Menu'
import { ConfirmDialog } from '@/ui/Overlay'
import { PageHeader } from '@/ui/PageHeader'
import { StatusBadge, StatusSelect, StatusStepper } from '@/ui/Status'
import { useToast } from '@/ui/toastContext'
import { Checkbox, Toggle } from '@/ui/Toggle'

/** Dev-only gallery of the Tile kit, to compare against `Tile — Components` in tagy.pen. */
export function KitPage() {
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [status, setStatus] = useState<DisplayStatus>('draft')
  const [toggle, setToggle] = useState(true)
  const [check, setCheck] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [due, setDue] = useState('2026-10-30')
  const [email, setEmail] = useState('billing@northwind.co')

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Tile kit" subtitle="Every component, for checking against the design" />

      <Section title="Actions">
        <Button variant="primary" icon={Send}>
          Send invoice
        </Button>
        <Button variant="dark" icon={Plus}>
          New invoice
        </Button>
        <Button variant="soft" icon={Copy}>
          Copy link
        </Button>
        <Button variant="outline" icon={Download}>
          PDF
        </Button>
        <Button variant="danger" icon={Trash2}>
          Delete invoice
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <IconButton icon={Ellipsis} label="More actions" />
        <DropdownButton>Template · Bold</DropdownButton>
        <Chip icon={Mail}>Email</Chip>
        <MiniChip>8%</MiniChip>
      </Section>

      <Section title="Filters">
        {[
          ['all', 'All', 42],
          ['draft', 'Draft', 3],
          ['sent', 'Sent', 8],
          ['overdue', 'Overdue', 2],
          ['paid', 'Paid', 29],
        ].map(([key, label, count]) => (
          <FilterPill
            key={key}
            active={filter === key}
            count={count as number}
            onClick={() => setFilter(key as string)}
          >
            {label}
          </FilterPill>
        ))}
      </Section>

      <Section title="Status">
        <StatusBadge status="draft" />
        <StatusBadge status="sent" />
        <StatusBadge status="paid" />
        <StatusBadge status="overdue" />
        <Menu trigger={<StatusSelect status={status} />} align="start">
          {(['draft', 'sent', 'paid'] as const).map((s) => (
            <MenuItem
              key={s}
              icon={s === 'paid' ? CircleCheck : s === 'sent' ? Send : PencilLine}
              label={s[0]!.toUpperCase() + s.slice(1)}
              selected={status === s}
              onSelect={() => setStatus(s)}
            />
          ))}
        </Menu>
        <div className="w-full max-w-[460px]">
          <StatusStepper
            steps={[
              { label: 'Draft', date: '16 Oct', done: true, icon: PencilLine },
              { label: 'Sent', date: '16 Oct', done: true, icon: Send },
              { label: 'Paid', date: null, done: false },
            ]}
          />
        </div>
      </Section>

      <Section title="Data">
        <Party name="Northwind Studio" sub="billing@northwind.co" />
        <Figure value="$12,927.60" label="Total due" />
        <Figure value="$18,640.00" label="Unpaid" tone="orange" />
        <Stat
          label="Tax"
          value="Maine sales"
          chip={<MiniChip>8%</MiniChip>}
          className="w-[150px]"
        />
      </Section>

      <Section title="Fields" grid>
        <TextField label="Invoice number" defaultValue="INV-0042" />
        <TextField
          label="Client email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <SelectField
          label="Currency"
          defaultValue="USD"
          options={[
            { value: 'USD', label: 'USD — US Dollar' },
            { value: 'EUR', label: 'EUR — Euro' },
            { value: 'IDR', label: 'IDR — Indonesian Rupiah' },
          ]}
        />
        <DateField
          label="Due date"
          display={due.split('-').reverse().join('/')}
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
        <TextField
          label="Invoice number"
          defaultValue="INV-0041"
          error="INV-0041 is already used"
        />
        <TextField label="Tax ID" placeholder="Optional" hint="Shown on invoices when set" />
        <TextAreaField
          label="Notes"
          defaultValue="Thank you for your business! Please include the invoice number with your payment."
          className="sm:col-span-2"
        />
      </Section>

      <Section title="Controls">
        <Toggle checked={toggle} onCheckedChange={setToggle}>
          Show payment details
        </Toggle>
        <Checkbox checked={check} onCheckedChange={setCheck}>
          Apply tax (8%)
        </Checkbox>
      </Section>

      <Section title="Overlays">
        <Menu trigger={<IconButton icon={Ellipsis} label="Invoice actions" />} align="start">
          <MenuItem
            icon={CircleCheck}
            label="Mark as paid"
            description="Record the payment date"
            onSelect={() =>
              toast({
                message: 'INV-0041 marked as paid · 28 Oct',
                action: { label: 'Undo', onClick: () => {} },
              })
            }
          />
          <MenuItem icon={FileText} label="Open & edit" onSelect={() => {}} />
          <MenuItem icon={Copy} label="Duplicate" onSelect={() => {}} />
          <MenuItem icon={Download} label="Download PDF" onSelect={() => {}} />
          <MenuItem icon={Undo2} label="Back to draft" onSelect={() => {}} />
          <MenuDivider />
          <MenuItem
            icon={Trash2}
            label="Delete invoice"
            tone="danger"
            onSelect={() => setConfirmOpen(true)}
          />
        </Menu>
        <Button icon={Trash2} onClick={() => setConfirmOpen(true)}>
          Delete dialog
        </Button>
        <Button
          icon={CircleCheck}
          onClick={() =>
            toast({
              message: 'INV-0041 marked as paid · 28 Oct',
              action: { label: 'Undo', onClick: () => toast({ message: 'Payment removed' }) },
            })
          }
        >
          Show toast
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          icon={Trash2}
          tone="danger"
          title="Delete INV-0041?"
          description="This removes the $3,140.00 invoice for Acme Co. from this browser. There's no account to restore it from, so it can't be recovered later."
          confirmLabel="Delete invoice"
          confirmIcon={Trash2}
          onConfirm={() =>
            toast({ message: 'INV-0041 deleted', action: { label: 'Undo', onClick: () => {} } })
          }
        />
      </Section>
    </div>
  )
}

function Section({
  title,
  grid,
  children,
}: {
  title: string
  grid?: boolean
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold tracking-[-0.3px]">{title}</h2>
      <div
        className={
          grid ? 'grid max-w-3xl gap-3 sm:grid-cols-2' : 'flex flex-wrap items-center gap-3'
        }
      >
        {children}
      </div>
    </section>
  )
}
