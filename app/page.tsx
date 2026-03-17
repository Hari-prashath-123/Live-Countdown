import CountdownTimer from "@/components/countdown-timer";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#27272a_0%,#09090b_45%,#020617_100%)] px-6 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.04)_45%,transparent_70%)]" />
      <div className="relative z-10 w-full">
        <CountdownTimer />
      </div>
    </main>
  );
}
