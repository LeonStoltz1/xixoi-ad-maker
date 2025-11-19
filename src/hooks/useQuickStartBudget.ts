import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

type QuickStartBudget = {
  plan: string | null
  usedCents: number
  weeklyCapCents: number
  weekStartsAt: string | null
}

export function useQuickStartBudget() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<QuickStartBudget | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (isMounted) {
          setData(null)
          setLoading(false)
        }
        return
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("plan, quickstart_weekly_spend, quickstart_week_start_date")
        .eq("id", user.id)
        .single()

      if (error || !profile) {
        if (isMounted) {
          setData(null)
          setLoading(false)
        }
        return
      }

      if (isMounted) {
        setData({
          plan: profile.plan,
          usedCents: profile.quickstart_weekly_spend ?? 0,
          weeklyCapCents: 30000, // $300 * 100
          weekStartsAt: profile.quickstart_week_start_date,
        })
        setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  return { loading, data }
}
