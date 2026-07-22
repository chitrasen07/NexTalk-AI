"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { PasswordInput } from "@/components/auth/password-input";
import { GoogleButton } from "@/components/auth/google-button";
import { ConfigWarning } from "@/components/auth/config-warning";
import { useAuth } from "@/contexts/auth-context";
import { auth } from "@/lib/firebase/config";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { getFriendlyErrorMessage } from "@/lib/firebase/errors";
import { updateAuthProfile } from "@/lib/firebase/auth";
import { updateUserProfile } from "@/lib/firebase/firestore";
import {
  uploadProfileImage,
  validateProfileImage,
} from "@/lib/firebase/storage";
import {
  getPasswordStrength,
  registerSchema,
  type RegisterValues,
} from "@/lib/validations/auth";
import { cn, getInitials } from "@/lib/utils";

const STRENGTH_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-amber-500",
  "bg-blue-500",
  "bg-emerald-500",
];

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser, loginWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false as unknown as true,
    },
  });

  const password = watch("password") ?? "";
  const name = watch("name") ?? "";
  const terms = watch("terms");
  const strength = getPasswordStrength(password);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const error = validateProfileImage(file);
    if (error) {
      toast.error(error);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (values: RegisterValues) => {
    try {
      await registerUser(
        values.name,
        values.username,
        values.email,
        values.password,
      );

      // Upload profile image after the account + profile doc exist.
      const currentUser = auth.currentUser;
      if (currentUser && imageFile) {
        try {
          const result = await uploadProfileImage(currentUser.uid, imageFile);
          await updateAuthProfile(currentUser, { photoURL: result.url });
          await updateUserProfile(currentUser.uid, { photoURL: result.url });
        } catch {
          toast.warning("Account created, but the profile image upload failed.");
        }
      }

      toast.success("Account created! Please verify your email.");
      router.replace("/verify-email");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success("Signed up with Google");
      router.replace("/chat");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const disabled = !isFirebaseConfigured;

  return (
    <div>
      <div className="mb-6 lg:hidden">
        <Logo size="md" />
      </div>
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
        <p className="text-muted-foreground">
          Join ChatSphere AI and start chatting smarter.
        </p>
      </div>

      <ConfigWarning />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-border">
              {imagePreview ? (
                <AvatarImage src={imagePreview} alt="Profile preview" />
              ) : null}
              <AvatarFallback className="bg-muted text-lg">
                {name ? getInitials(name) : <Camera className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full brand-gradient text-white shadow-md"
              aria-label="Upload profile picture"
            >
              <Camera className="h-4 w-4" />
            </button>
            {imagePreview ? (
              <button
                type="button"
                onClick={clearImage}
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                aria-label="Remove profile picture"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              placeholder="ada"
              aria-invalid={!!errors.username}
              {...register("username")}
            />
            {errors.username ? (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {password ? (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      i < strength.score
                        ? STRENGTH_COLORS[strength.score]
                        : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Password strength: {strength.label}
              </p>
            </div>
          ) : null}
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <Checkbox
            id="terms"
            checked={!!terms}
            onChange={(e) =>
              setValue("terms", e.target.checked as unknown as true, {
                shouldValidate: true,
              })
            }
            label={
              <span>
                I agree to the{" "}
                <Link href="#" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </span>
            }
          />
          {errors.terms ? (
            <p className="text-sm text-destructive">{errors.terms.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          variant="brand"
          className="w-full"
          disabled={isSubmitting || disabled}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create account
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton
        onClick={handleGoogle}
        loading={googleLoading}
        disabled={disabled}
        label="Sign up with Google"
      />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
