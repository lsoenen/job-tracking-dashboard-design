"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { CalendarDays } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type AppliedDatePickerProps = {
  value?: string
  company: string
  role: string
  onChange: (value: string | undefined) => void
}

export function AppliedDatePicker({ value, company, role, onChange }: AppliedDatePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = value ? parseISO(value) : undefined
  const formattedDate = selectedDate ? format(selectedDate, "MMM d, yyyy") : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={formattedDate
              ? `Change applied date for ${role} at ${company}, currently ${formattedDate}`
              : `Set applied date for ${role} at ${company}`}
            className="h-7 w-full justify-start gap-1.5 px-1.5 text-xs font-normal"
          />
        }
      >
        <CalendarDays data-icon="inline-start" aria-hidden="true" />
        <span className="truncate">{formattedDate ?? "Set date"}</span>
      </PopoverTrigger>
      {open && (
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            required
            selected={selectedDate ?? new Date()}
            defaultMonth={selectedDate ?? new Date()}
            onSelect={(date) => {
              if (!date) return
              onChange(format(date, "yyyy-MM-dd"))
              setOpen(false)
            }}
          />
          {value && (
            <div className="flex justify-end border-t border-border px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  onChange(undefined)
                  setOpen(false)
                }}
              >
                Clear date
              </Button>
            </div>
          )}
        </PopoverContent>
      )}
    </Popover>
  )
}
