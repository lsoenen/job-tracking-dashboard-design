import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { JobProfile } from "@/lib/job-profile"

type JobProfileFormProps = {
  profile: JobProfile
  onChange: (patch: Partial<JobProfile>) => void
}

export function JobProfileForm({ profile, onChange }: JobProfileFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          Profile details
        </CardTitle>
        <CardDescription>General details used to estimate your match with recommended roles.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="profile-name">Full name</FieldLabel>
              <Input
                id="profile-name"
                autoComplete="name"
                maxLength={80}
                required
                value={profile.fullName}
                onChange={(event) => onChange({ fullName: event.currentTarget.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-headline">Current title</FieldLabel>
              <Input
                id="profile-headline"
                autoComplete="organization-title"
                maxLength={100}
                required
                value={profile.headline}
                onChange={(event) => onChange({ headline: event.currentTarget.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-location">Location</FieldLabel>
              <Input
                id="profile-location"
                autoComplete="address-level2"
                maxLength={100}
                placeholder="City, region"
                value={profile.location}
                onChange={(event) => onChange({ location: event.currentTarget.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-experience">Years of experience</FieldLabel>
              <Input
                id="profile-experience"
                type="number"
                min={0}
                max={50}
                step={1}
                value={profile.yearsExperience}
                onChange={(event) => onChange({ yearsExperience: Number(event.currentTarget.value) || 0 })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-weekly-goal">Weekly application goal</FieldLabel>
              <Input
                id="profile-weekly-goal"
                type="number"
                min={0}
                max={100}
                step={1}
                value={profile.weeklyApplicationGoal}
                onChange={(event) => onChange({ weeklyApplicationGoal: Number(event.currentTarget.value) || 0 })}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="profile-skills">Skills</FieldLabel>
            <Input
              id="profile-skills"
              maxLength={500}
              placeholder="User research, Figma, prototyping"
              value={profile.skills}
              onChange={(event) => onChange({ skills: event.currentTarget.value })}
            />
            <FieldDescription>Separate skills with commas. These help calculate each fit score.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-background">Background</FieldLabel>
            <Textarea
              id="profile-background"
              maxLength={1200}
              placeholder="Add a short summary of your experience and the work you do best."
              rows={5}
              value={profile.background}
              onChange={(event) => onChange({ background: event.currentTarget.value })}
            />
            <FieldDescription>Include relevant experience, industries, and kinds of products you have worked on.</FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
