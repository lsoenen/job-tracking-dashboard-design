"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { LoaderCircle, Plus, Save, Star, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  companySizes,
  companyStages,
  employmentTypes,
  excitementLabels,
  jobSources,
  salaryPeriods,
  workArrangements,
  type CustomField,
  type JobDetails,
} from "@/lib/job-details"

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

function Choice<T extends string>({
  id,
  value,
  options,
  onChange,
}: {
  id: string
  value?: T
  options: readonly T[]
  onChange: (value: T | undefined) => void
}) {
  return (
    <select id={id} className={selectClassName} value={value ?? ""} onChange={(event) => onChange((event.target.value || undefined) as T | undefined)}>
      <option value="">Not set</option>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  )
}

export function ExcitementPicker({
  value,
  onChange,
  size = "md",
}: {
  value?: number
  onChange: (value: number | undefined) => void
  size?: "sm" | "md"
}) {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value ?? 0

  return (
    <div className="flex items-center gap-2">
      <div role="radiogroup" aria-label="Excitement" className="flex" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={value === level}
            aria-label={`${level} of 5: ${excitementLabels[level]}`}
            title={excitementLabels[level]}
            onMouseEnter={() => setHover(level)}
            onClick={() => onChange(value === level ? undefined : level)}
            className="rounded-sm p-0.5 text-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star
              aria-hidden="true"
              className={`${size === "sm" ? "size-4" : "size-5"} transition-colors ${level <= shown ? "fill-current" : "fill-transparent text-muted-foreground/40"}`}
            />
          </button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{shown ? excitementLabels[shown] : "Not rated"}</span>
    </div>
  )
}

export function EditJobDetailsSheet({
  open,
  details,
  company,
  role,
  onOpenChange,
  onSave,
}: {
  open: boolean
  details: JobDetails
  company: string
  role: string
  onOpenChange: (open: boolean) => void
  onSave: (details: JobDetails) => Promise<boolean>
}) {
  const [draft, setDraft] = useState<JobDetails>(details)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDraft({ ...details, custom: details.custom?.map((field) => ({ ...field })) })
      setError(null)
    }
    // Start from the saved values each time the panel opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function update<Key extends keyof JobDetails>(key: Key, value: JobDetails[Key]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function money(key: "salaryMin" | "salaryMax", raw: string) {
    const number = raw === "" ? undefined : Number(raw)
    update(key, number !== undefined && Number.isFinite(number) && number >= 0 ? number : undefined)
  }

  function updateCustom(id: string, patch: Partial<CustomField>) {
    update("custom", (draft.custom ?? []).map((field) => (field.id === id ? { ...field, ...patch } : field)))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (draft.salaryMin && draft.salaryMax && draft.salaryMin > draft.salaryMax) {
      setError("The salary minimum is higher than the maximum.")
      return
    }
    let website = draft.companyWebsite?.trim()
    if (website) {
      try {
        website = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`).toString()
      } catch {
        setError("Enter a valid company website, or leave it blank.")
        return
      }
    }

    setIsSaving(true)
    const saved = await onSave({ ...draft, companyWebsite: website })
    setIsSaving(false)
    if (saved) onOpenChange(false)
    else setError("These details couldn't be saved. Please try again.")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit job details</SheetTitle>
          <SheetDescription>{role} at {company}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
            <Section title="Compensation">
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="details-salary-min">Salary from</FieldLabel>
                  <Input id="details-salary-min" type="number" inputMode="numeric" min={0} step={1000} value={draft.salaryMin ?? ""} onChange={(event) => money("salaryMin", event.target.value)} placeholder="150000" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="details-salary-max">Salary to</FieldLabel>
                  <Input id="details-salary-max" type="number" inputMode="numeric" min={0} step={1000} value={draft.salaryMax ?? ""} onChange={(event) => money("salaryMax", event.target.value)} placeholder="190000" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="details-currency">Currency</FieldLabel>
                  <Choice id="details-currency" value={draft.salaryCurrency} options={["USD", "CAD", "EUR", "GBP"] as const} onChange={(value) => update("salaryCurrency", value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="details-period">Per</FieldLabel>
                  <Choice id="details-period" value={draft.salaryPeriod} options={salaryPeriods} onChange={(value) => update("salaryPeriod", value)} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="details-equity">Equity</FieldLabel>
                <Input id="details-equity" value={draft.equity ?? ""} onChange={(event) => update("equity", event.target.value)} placeholder="e.g. RSUs, 0.1% options" />
              </Field>
              <Field>
                <FieldLabel htmlFor="details-bonus">Bonus</FieldLabel>
                <Input id="details-bonus" value={draft.bonus ?? ""} onChange={(event) => update("bonus", event.target.value)} placeholder="e.g. 10% target" />
              </Field>
              <Field>
                <FieldLabel htmlFor="details-benefits">Benefits</FieldLabel>
                <Textarea id="details-benefits" value={draft.benefits ?? ""} onChange={(event) => update("benefits", event.target.value)} rows={2} maxLength={1000} />
              </Field>
            </Section>

            <Section title="Role">
              <Field>
                <FieldLabel htmlFor="details-location">Location</FieldLabel>
                <Input id="details-location" value={draft.location ?? ""} onChange={(event) => update("location", event.target.value)} placeholder="e.g. New York, NY" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="details-arrangement">Work arrangement</FieldLabel>
                  <Choice id="details-arrangement" value={draft.workArrangement} options={workArrangements} onChange={(value) => update("workArrangement", value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="details-type">Employment type</FieldLabel>
                  <Choice id="details-type" value={draft.employmentType} options={employmentTypes} onChange={(value) => update("employmentType", value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="details-level">Level</FieldLabel>
                  <Input id="details-level" value={draft.level ?? ""} onChange={(event) => update("level", event.target.value)} placeholder="e.g. Senior" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="details-team">Team</FieldLabel>
                  <Input id="details-team" value={draft.team ?? ""} onChange={(event) => update("team", event.target.value)} placeholder="e.g. Payments" />
                </Field>
              </div>
            </Section>

            <Section title="Company">
              <Field>
                <FieldLabel htmlFor="details-industry">Industry</FieldLabel>
                <Input id="details-industry" value={draft.industry ?? ""} onChange={(event) => update("industry", event.target.value)} placeholder="e.g. Fintech" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="details-stage">Stage</FieldLabel>
                  <Choice id="details-stage" value={draft.companyStage} options={companyStages} onChange={(value) => update("companyStage", value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="details-size">Employees</FieldLabel>
                  <Choice id="details-size" value={draft.companySize} options={companySizes} onChange={(value) => update("companySize", value)} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="details-website">Website</FieldLabel>
                <Input id="details-website" type="url" value={draft.companyWebsite ?? ""} onChange={(event) => update("companyWebsite", event.target.value)} placeholder="https://" />
              </Field>
            </Section>

            <Section title="Your take">
              <Field>
                <FieldLabel>Excitement</FieldLabel>
                <ExcitementPicker value={draft.excitement} onChange={(value) => update("excitement", value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="details-pros">What excites you</FieldLabel>
                <Textarea id="details-pros" value={draft.pros ?? ""} onChange={(event) => update("pros", event.target.value)} rows={2} maxLength={1500} />
              </Field>
              <Field>
                <FieldLabel htmlFor="details-concerns">Concerns or questions</FieldLabel>
                <Textarea id="details-concerns" value={draft.concerns ?? ""} onChange={(event) => update("concerns", event.target.value)} rows={2} maxLength={1500} />
              </Field>
            </Section>

            <Section title="Source & dates">
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="details-source">Found via</FieldLabel>
                  <Choice id="details-source" value={draft.source} options={jobSources} onChange={(value) => update("source", value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="details-deadline">Application deadline</FieldLabel>
                  <Input id="details-deadline" type="date" value={draft.deadline ?? ""} onChange={(event) => update("deadline", event.target.value)} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="details-referred">Referred by</FieldLabel>
                <Input id="details-referred" value={draft.referredBy ?? ""} onChange={(event) => update("referredBy", event.target.value)} />
              </Field>
            </Section>

            <Section title="Other details">
              <FieldGroup className="gap-2">
                {(draft.custom ?? []).map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] items-center gap-2">
                    <Input aria-label={`Field ${index + 1} name`} value={field.label} onChange={(event) => updateCustom(field.id, { label: event.target.value })} placeholder="e.g. Visa sponsorship" maxLength={60} />
                    <Input aria-label={`Field ${index + 1} value`} value={field.value} onChange={(event) => updateCustom(field.id, { value: event.target.value })} placeholder="e.g. Yes" maxLength={300} />
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Remove ${field.label || "field"}`}
                      onClick={() => update("custom", (draft.custom ?? []).filter((item) => item.id !== field.id))}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </FieldGroup>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-fit"
                onClick={() => update("custom", [...(draft.custom ?? []), { id: crypto.randomUUID(), label: "", value: "" }])}
              >
                <Plus data-icon="inline-start" aria-hidden="true" />
                Add a field
              </Button>
            </Section>

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>

          <SheetFooter>
            <SheetClose render={<Button type="button" variant="outline" disabled={isSaving} />}>Cancel</SheetClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" /> : <Save data-icon="inline-start" aria-hidden="true" />}
              Save details
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
