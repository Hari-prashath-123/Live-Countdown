"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type TimerApiResponse = {
  target_time: string | null;
  is_active: boolean;
};

type CountdownState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const EMPTY_COUNTDOWN: CountdownState = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

function getRemainingTime(targetIso: string): CountdownState {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const distance = Math.max(target - now, 0);

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  return { days, hours, minutes, seconds };
}

function formatUnit(value: number) {
  return value.toString().padStart(2, "0");
}

export default function CountdownTimer() {
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [targetTime, setTargetTime] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<CountdownState>(EMPTY_COUNTDOWN);

  function applyTimerState(nextTargetTime: string | null, nextIsActive: boolean) {
    setTargetTime(nextTargetTime);
    setIsActive(nextIsActive);

    if (nextIsActive && nextTargetTime) {
      const nextRemaining = getRemainingTime(nextTargetTime);
      const endedNow =
        nextRemaining.days === 0 &&
        nextRemaining.hours === 0 &&
        nextRemaining.minutes === 0 &&
        nextRemaining.seconds === 0;

      setRemaining(nextRemaining);
      setHasEnded(endedNow);

      if (endedNow) {
        setIsActive(false);
      }
      return;
    }

    setRemaining(EMPTY_COUNTDOWN);
    setHasEnded(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchTimerState() {
      try {
        const response = await fetch("/api/timer", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Unable to fetch timer state");
        }

        const data = (await response.json()) as TimerApiResponse;

        if (!isMounted) {
          return;
        }

        applyTimerState(data.target_time, Boolean(data.is_active));
      } catch {
        if (!isMounted) {
          return;
        }

        setIsActive(false);
        setTargetTime(null);
        setRemaining(EMPTY_COUNTDOWN);
        setHasEnded(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    const channel = supabase
      .channel("timer-state-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "timer_state",
          filter: "id=eq.1",
        },
        (payload) => {
          const updated = payload.new as TimerApiResponse;
          applyTimerState(updated.target_time, Boolean(updated.is_active));
        }
      )
      .subscribe();

    fetchTimerState();

    return () => {
      isMounted = false;
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!isActive || !targetTime) {
      return;
    }

    const interval = setInterval(() => {
      const next = getRemainingTime(targetTime);
      const ended =
        next.days === 0 &&
        next.hours === 0 &&
        next.minutes === 0 &&
        next.seconds === 0;

      setRemaining(next);

      if (ended) {
        setHasEnded(true);
        setIsActive(false);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isActive, targetTime]);

  const units = useMemo(
    () => [
      { label: "Days", value: formatUnit(remaining.days) },
      { label: "Hours", value: formatUnit(remaining.hours) },
      { label: "Minutes", value: formatUnit(remaining.minutes) },
      { label: "Seconds", value: formatUnit(remaining.seconds) },
    ],
    [remaining]
  );

  if (isLoading) {
    return <p className="text-center text-lg text-zinc-300">Loading timer...</p>;
  }

  if (!isActive) {
    return (
      <p className="text-center text-3xl font-semibold tracking-wide text-zinc-100 sm:text-5xl">
        {hasEnded ? "Timer Ended" : "Waiting to Start"}
      </p>
    );
  }

  return (
    <section className="w-full max-w-5xl">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {units.map((unit) => (
          <article
            key={unit.label}
            className="rounded-2xl border border-zinc-700/70 bg-zinc-900/70 p-4 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-6"
          >
            <p className="text-4xl font-black leading-none tracking-tight text-zinc-100 sm:text-6xl">
              {unit.value}
            </p>
            <p className="mt-3 text-xs font-medium tracking-[0.18em] text-zinc-400 uppercase sm:text-sm">
              {unit.label}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
