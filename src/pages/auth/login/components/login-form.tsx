import { useState, type FormEvent } from "react";
import {
  BookOpen,
  ExternalLink,
  Eye,
  EyeOff,
  GraduationCap,
  UsersRound,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LoginFormValues, LoginStatus } from "../types";

type LoginFormProps = {
  status: LoginStatus;
  errorMessage: string | null;
  onSubmit: (values: LoginFormValues) => Promise<void>;
};

const QRUPI_APPS = [
  {
    label: "Qrupi Guru",
    url: import.meta.env.VITE_QRUPI_GURU_URL,
    icon: GraduationCap,
  },
  {
    label: "Qrupi Orang Tua",
    url: import.meta.env.VITE_QRUPI_ORANG_TUA_URL,
    icon: UsersRound,
  },
  { label: "LMS", url: import.meta.env.VITE_QRUPI_LMS_URL, icon: BookOpen },
];

export function LoginForm({ status, errorMessage, onSubmit }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isSubmitting = status === "submitting";

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await onSubmit({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      remember: true,
    });
  }

  return (
    <div className="mt-12">
      <p className="mb-3 text-center text-[10px] text-zinc-500 sm:text-xs">
        Buka aplikasi Qrupi lainnya
      </p>
      <div className="grid grid-cols-3 gap-2">
        {QRUPI_APPS.map(({ label, url, icon: Icon }) => (
          <a
            key={label}
            href={url ?? "#"}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "group h-auto min-h-20 flex-col gap-2 rounded-xl border-zinc-200 bg-white px-1 py-3 text-center text-[9px] leading-tight text-zinc-700 shadow-none hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:px-2 sm:text-[11px] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-blue-950/30",
            )}
            aria-label={`Buka ${label}`}
          >
            <span className="relative grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <Icon className="size-4" />
              <ExternalLink className="absolute -top-1 -right-1 size-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
            {label}
          </a>
        ))}
      </div>
      <div className="my-7 flex items-center gap-4 text-[10px] text-zinc-500 sm:text-xs">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span>atau masuk ke CRM</span>
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <form className="grid gap-3" onSubmit={submitLogin}>
        <Input
          name="email"
          type="email"
          placeholder="Masukkan alamat email"
          autoComplete="email"
          required
          disabled={isSubmitting}
          className="h-12 rounded-xl border-0 bg-zinc-100 px-4 text-xs shadow-none placeholder:text-zinc-400 sm:text-sm dark:bg-zinc-900"
        />
        <div className="relative">
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan kata sandi"
            autoComplete="current-password"
            minLength={6}
            required
            disabled={isSubmitting}
            className="h-12 rounded-xl border-0 bg-zinc-100 px-4 pr-12 text-xs shadow-none placeholder:text-zinc-400 sm:text-sm dark:bg-zinc-900"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:bg-transparent hover:text-zinc-700 dark:hover:text-zinc-200"
            aria-label={
              showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </Button>
        </div>
        {errorMessage && (
          <p className="text-xs text-red-600" role="alert">
            {errorMessage}
          </p>
        )}
        {status === "success" && (
          <p className="text-xs text-emerald-600" role="status">
            Login berhasil.
          </p>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 h-12 rounded-full bg-blue-700 text-xs text-white hover:bg-blue-800 sm:text-sm dark:bg-white dark:text-zinc-950"
        >
          {isSubmitting ? "Memproses..." : "Lanjutkan"}
        </Button>
      </form>
    </div>
  );
}
