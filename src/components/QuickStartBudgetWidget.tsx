import { useMemo } from "react"
import { useQuickStartBudget } from "@/hooks/useQuickStartBudget"
import { useNavigate } from "react-router-dom"

export function QuickStartBudgetWidget() {
  const navigate = useNavigate()
  const { loading, data } = useQuickStartBudget()

  const derived = useMemo(() => {
    if (!data) return null
    if (data.plan !== "quickstart") return null

    const used = data.usedCents / 100
    const cap = data.weeklyCapCents / 100
    const pct = Math.min(100, (used / cap) * 100)

    let resetsInLabel = "this week"
    if (data.weekStartsAt) {
      const start = new Date(data.weekStartsAt)
      const reset = new Date(start)
      reset.setDate(start.getDate() + 7)

      const today = new Date()
      const diffMs = reset.getTime() - today.getTime()
      const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
      resetsInLabel = diffDays === 0 ? "today" : `in ${diffDays} day${diffDays === 1 ? "" : "s"}`
    }

    return { used, cap, pct, resetsInLabel }
  }, [data])

  if (loading || !derived) return null

  return (
    <div className="border-2 border-foreground bg-background p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-foreground/60">
        <span>Quick-Start Budget</span>
        <span>Resets {derived.resetsInLabel}</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-mono">
          ${derived.used.toFixed(0)}
        </span>
        <span className="text-xs text-foreground/60">of ${derived.cap.toFixed(0)} used this week</span>
      </div>

      {/* Progress bar (sharp edges, no softness) */}
      <div className="h-[3px] w-full border border-foreground bg-foreground/10">
        <div
          className="h-full bg-foreground"
          style={{ width: `${derived.pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-1 text-[11px] text-foreground/60">
        <span>Upgrade to remove the $300/week cap.</span>
        <button
          className="border border-foreground px-3 py-1 text-[10px] uppercase tracking-[0.16em] bg-background text-foreground hover:bg-foreground hover:text-background transition-colors"
          onClick={() => navigate("/pricing")}
        >
          Upgrade to Pro
        </button>
      </div>
    </div>
  )
}
