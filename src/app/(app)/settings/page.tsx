"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, LogOut, Moon, ShieldCheck, Sun } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { requestNotificationPermission } from "@/lib/firebase/messaging";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [notifications, setNotifications] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (typeof Notification !== "undefined") {
      setNotifications(Notification.permission === "granted");
    }
  }, []);

  const handleNotificationsToggle = async (checked: boolean) => {
    if (!checked || !user) {
      setNotifications(false);
      return;
    }
    const token = await requestNotificationPermission(user.uid);
    if (token) {
      setNotifications(true);
      toast.success("Push notifications enabled");
    } else {
      setNotifications(false);
      toast.error("Notifications permission was not granted.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch {
      toast.error("Failed to sign out.");
    }
  };

  const isDark = mounted && theme === "dark";

  return (
    <PageShell title="Settings" description="Customize your experience.">
      <div className="space-y-4">
        <Card>
          <CardContent className="divide-y pt-6">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                {isDark ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-primary" />
                )}
                <div>
                  <Label htmlFor="dark-mode">Dark mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes.
                  </p>
                </div>
              </div>
              <Switch
                id="dark-mode"
                checked={isDark}
                onCheckedChange={(c) => setTheme(c ? "dark" : "light")}
              />
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="notifications">Push notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new messages.
                  </p>
                </div>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={(c) => void handleNotificationsToggle(c)}
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Signed in as</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Button
          variant="destructive"
          className="w-full"
          onClick={() => void handleLogout()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </PageShell>
  );
}
