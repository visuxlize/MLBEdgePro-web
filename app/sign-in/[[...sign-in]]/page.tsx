import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 bg-background overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#FF7828]/[0.06] blur-[100px]" />
      <div className="pointer-events-none absolute -top-40 right-1/4 w-80 h-80 rounded-full bg-indigo-500/[0.05] blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#FF7828",
              colorBackground: "#111622",
              colorInputBackground: "#191C22",
              colorInputText: "#ffffff",
              colorText: "#ffffff",
              colorTextSecondary: "rgba(255,255,255,0.45)",
              colorDanger: "#eb505a",
              borderRadius: "0.875rem",
            },
          }}
          redirectUrl="/games"
        />
      </div>
    </div>
  );
}
