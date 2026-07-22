"use client";

import * as React from "react";
import { Camera, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { auth } from "@/lib/firebase/config";
import { updateAuthProfile } from "@/lib/firebase/auth";
import { updateUserProfile } from "@/lib/firebase/firestore";
import {
  uploadProfileImage,
  validateProfileImage,
} from "@/lib/firebase/storage";
import { getFriendlyErrorMessage } from "@/lib/firebase/errors";
import { getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [name, setName] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAbout(profile.about);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { name: name.trim(), about: about.trim() });
      if (auth.currentUser) {
        await updateAuthProfile(auth.currentUser, { displayName: name.trim() });
      }
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    const validationError = validateProfileImage(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadProfileImage(user.uid, file, {
        onProgress: setProgress,
      });
      await updateUserProfile(user.uid, { photoURL: result.url });
      if (auth.currentUser) {
        await updateAuthProfile(auth.currentUser, { photoURL: result.url });
      }
      toast.success("Profile picture updated");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageShell title="Profile" description="Manage how others see you.">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-border">
                {profile?.photoURL ? (
                  <AvatarImage src={profile.photoURL} alt={profile.name} />
                ) : null}
                <AvatarFallback className="brand-gradient text-2xl text-white">
                  {getInitials(profile?.name ?? name)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full brand-gradient text-white shadow-md"
                aria-label="Change profile picture"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>
            <div>
              <p className="text-lg font-semibold">{profile?.name}</p>
              <p className="text-sm text-muted-foreground">
                @{profile?.username}
              </p>
              {uploading ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Uploading… {progress}%
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={profile?.username ?? ""}
              disabled
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              Usernames can&apos;t be changed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile?.email ?? ""} disabled readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="about">About</Label>
            <Textarea
              id="about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={3}
              maxLength={200}
            />
          </div>

          <Button
            variant="brand"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save changes
          </Button>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleImage(e)}
      />
    </PageShell>
  );
}
