import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

type TimerPayload = {
  target_time?: string | null;
  is_active?: boolean;
};

export async function GET() {
  const { data, error } = await supabase
    .from("timer_state")
    .select("target_time,is_active")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch timer state." },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}

export async function POST(request: Request) {
  let payload: TimerPayload;

  try {
    payload = (await request.json()) as TimerPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { target_time, is_active } = payload;

  if (typeof is_active !== "boolean") {
    return NextResponse.json(
      { error: "Field is_active must be a boolean." },
      { status: 400 }
    );
  }

  if (is_active && !target_time) {
    return NextResponse.json(
      { error: "target_time is required when starting the timer." },
      { status: 400 }
    );
  }

  if (
    target_time !== undefined &&
    target_time !== null &&
    (typeof target_time !== "string" || Number.isNaN(new Date(target_time).getTime()))
  ) {
    return NextResponse.json(
      { error: "Field target_time must be a valid datetime string or null." },
      { status: 400 }
    );
  }

  const updatePayload = {
    target_time: target_time ?? null,
    is_active,
  };

  const { data, error } = await supabase
    .from("timer_state")
    .update(updatePayload)
    .eq("id", 1)
    .select("target_time,is_active")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update timer state." },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}
