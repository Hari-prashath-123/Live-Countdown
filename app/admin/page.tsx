"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type TimerResponse = {
  target_time: string | null;
  is_active: boolean;
  error?: string;
};

export default function AdminPage() {
  const [targetDateTime, setTargetDateTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function updateTimer(payload: { target_time: string | null; is_active: boolean }) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as TimerResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update timer.");
      }

      toast({
        title: "Timer updated",
        description: data.is_active
          ? "Countdown started successfully."
          : "Countdown stopped and reset.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Unexpected error updating timer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartTimer() {
    if (!targetDateTime) {
      toast({
        title: "Missing date",
        description: "Select a future date and time first.",
        variant: "destructive",
      });
      return;
    }

    const selectedDate = new Date(targetDateTime);

    if (Number.isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
      toast({
        title: "Invalid date",
        description: "Please choose a valid future date and time.",
        variant: "destructive",
      });
      return;
    }

    await updateTimer({
      target_time: selectedDate.toISOString(),
      is_active: true,
    });
  }

  async function handleStopTimer() {
    setTargetDateTime("");
    await updateTimer({
      target_time: null,
      is_active: false,
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Countdown Admin</CardTitle>
          <CardDescription>Set and control the live countdown timer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="target-time">Target Date and Time</Label>
            <Input
              id="target-time"
              type="datetime-local"
              value={targetDateTime}
              onChange={(event) => setTargetDateTime(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="sm:flex-1" onClick={handleStartTimer} disabled={isLoading}>
              {isLoading ? "Updating..." : "Start Timer"}
            </Button>
            <Button
              className="sm:flex-1"
              variant="destructive"
              onClick={handleStopTimer}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Stop/Reset Timer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
