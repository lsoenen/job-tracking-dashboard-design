"use client"

import { useRef, useState } from "react"
import { Camera, LoaderCircle, Trash2 } from "lucide-react"

import { useJobProfile } from "@/components/job-profile-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { maximumPhotoSize } from "@/lib/avatar-image"
import { profileInitials } from "@/lib/job-profile"

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"]

export function ProfilePhotoCard() {
  const { profile, email, avatarUrl, uploadAvatar, removeAvatar } = useJobProfile()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const displayName = profile.fullName.trim() || email

  async function handleFile(file: File) {
    setMessage("")
    if (!acceptedTypes.includes(file.type)) {
      setError("Choose a JPG, PNG or WebP image.")
      return
    }
    if (file.size > maximumPhotoSize) {
      setError("Choose an image smaller than 15 MB.")
      return
    }

    setError("")
    setBusy("upload")
    const failure = await uploadAvatar(file)
    setBusy(null)
    if (failure) setError(failure)
    else setMessage("Photo updated.")
  }

  async function handleRemove() {
    setError("")
    setMessage("")
    setBusy("remove")
    const failure = await removeAvatar()
    setBusy(null)
    if (failure) setError(failure)
    else setMessage("Photo removed.")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          Profile photo
        </CardTitle>
        <CardDescription>Shown in the sidebar. Only you can see it.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar className="size-16 shrink-0 border border-border">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={`${displayName}'s profile photo`} />}
          <AvatarFallback className="bg-muted text-base font-medium text-muted-foreground">
            {profileInitials(displayName) || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => inputRef.current?.click()}
            >
              {busy === "upload" ? (
                <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" />
              ) : (
                <Camera data-icon="inline-start" aria-hidden="true" />
              )}
              {avatarUrl ? "Change photo" : "Upload photo"}
            </Button>
            {avatarUrl && (
              <Button type="button" variant="ghost" size="sm" disabled={busy !== null} onClick={handleRemove}>
                {busy === "remove" ? (
                  <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" />
                ) : (
                  <Trash2 data-icon="inline-start" aria-hidden="true" />
                )}
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">JPG, PNG or WebP. We&apos;ll crop it to a square.</p>
          <input
            ref={inputRef}
            type="file"
            accept={acceptedTypes.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ""
              if (file) void handleFile(file)
            }}
          />
          <div aria-live="polite" className="text-xs">
            {error ? <p role="alert" className="text-destructive">{error}</p> : message && <p className="text-muted-foreground">{message}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
