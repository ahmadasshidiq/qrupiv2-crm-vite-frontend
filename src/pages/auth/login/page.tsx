import { useState } from "react";
import { LoginForm } from "./components/login-form";
import { LoginShowcase } from "./components/login-showcase";
import { login, persistSession } from "./actions";
import type { LoginFormValues, LoginStatus } from "./types";
import qrupiLogo from "@/assets/qrupi-logo.png";
import { useLocation, useNavigate } from "react-router-dom";
import { canAccessCrm, clearSession } from "@/lib/auth/session";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    const state = location.state as { error?: string } | null;
    return state?.error ?? null;
  });

  async function handleLogin(values: LoginFormValues) {
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const session = await login({
        email: values.email,
        password: values.password,
        remember_me: values.remember,
      });
      if (!canAccessCrm(session.user)) {
        clearSession();
        throw new Error(
          "Akun siswa tidak memiliki akses ke CRM. Silakan gunakan aplikasi LMS Qrupi.",
        );
      }
      persistSession(session, values.remember);
      setStatus("success");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Login gagal. Silakan coba lagi.",
      );
    }
  }

  return (
    <main className="grid min-h-svh bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 lg:grid-cols-2">
      <section
        className="flex min-h-svh items-center justify-center px-6 py-12 sm:px-12"
        aria-labelledby="login-title"
      >
        <div className="w-full max-w-[420px]">
          <img
            src={qrupiLogo}
            alt="Qrupi — QR untuk pelajar Indonesia"
            className="mx-auto mb-10 h-auto w-24 object-contain sm:w-28"
          />
          <h1
            id="login-title"
            className="text-center text-[18px] leading-tight font-bold tracking-[-0.03em] whitespace-nowrap sm:text-[22px]"
          >
            Selamat datang di{" "}
            <span className="text-blue-700 dark:text-blue-400">
              ekosistem QRUPI
            </span>
          </h1>
          <LoginForm
            status={status}
            errorMessage={errorMessage}
            onSubmit={handleLogin}
          />
          <p className="mt-4 text-center text-[9px] leading-4 text-zinc-500 sm:text-[11px] sm:leading-5">
            Dengan melanjutkan, Anda menyetujui{" "}
            <a
              className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-white"
              href="#terms"
            >
              Ketentuan Layanan
            </a>{" "}
            dan{" "}
            <a
              className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-white"
              href="#privacy"
            >
              Kebijakan Privasi
            </a>
            .
          </p>
        </div>
      </section>
      <LoginShowcase />
    </main>
  );
}
