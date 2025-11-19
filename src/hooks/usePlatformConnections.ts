import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export type PlatformKey = "meta" | "google" | "tiktok" | "linkedin" | "x"

type ConnectionsMap = Partial<Record<PlatformKey, boolean>>

export function usePlatformConnections() {
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState<ConnectionsMap>({})

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (isMounted) {
          setConnections({})
          setLoading(false)
        }
        return
      }

      const { data, error } = await supabase
        .from("platform_credentials")
        .select("platform, status")
        .eq("owner_type", "user")
        .eq("owner_id", user.id)

      if (error || !data) {
        if (isMounted) {
          setConnections({})
          setLoading(false)
        }
        return
      }

      const map: ConnectionsMap = {}

      for (const row of data) {
        if (row.status === "connected") {
          map[row.platform as PlatformKey] = true
        }
      }

      if (isMounted) {
        setConnections(map)
        setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  return { loading, connections }
}
