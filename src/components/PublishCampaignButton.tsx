import { useMemo } from "react"
import { usePlatformConnections, PlatformKey } from "@/hooks/usePlatformConnections"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

type Props = {
  selectedPlatforms: PlatformKey[]
  onPublish: () => void
  disabled?: boolean
  userPlan?: string
}

export function PublishCampaignButton({ selectedPlatforms, onPublish, disabled, userPlan }: Props) {
  const navigate = useNavigate()
  const { loading, connections } = usePlatformConnections()

  // Free users can connect OAuth but cannot publish without upgrading
  const isFree = userPlan === "free" || !userPlan
  // Quick-Start users don't need OAuth connections (use master accounts)
  const isQuickStart = userPlan === "quickstart"

  const missingPlatforms = useMemo(() => {
    if (isFree) return [] // Free users can have OAuth, but publishing triggers upgrade modal
    if (isQuickStart) return [] // Quick-Start uses system credentials
    if (!selectedPlatforms?.length) return []
    return selectedPlatforms.filter((p) => !connections[p])
  }, [selectedPlatforms, connections, isQuickStart, isFree])

  const isBlocked = !!missingPlatforms.length
  const finalDisabled = disabled || loading || isBlocked

  const hint =
    isBlocked && missingPlatforms.length === 1
      ? `Connect ${missingPlatforms[0].toUpperCase()} before publishing.`
      : isBlocked
      ? `Connect ${missingPlatforms.map((p) => p.toUpperCase()).join(", ")} before publishing.`
      : null

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        disabled={finalDisabled}
        onClick={() => {
          if (!finalDisabled) onPublish()
        }}
        className="w-full"
      >
        {loading ? "Checking connections..." : "Publish Campaign"}
      </Button>

      {hint && (
        <p className="text-[11px] text-foreground/60">
          {hint} Go to{" "}
          <button
            className="underline hover:text-foreground"
            onClick={() => navigate("/connect-platforms")}
          >
            Connected Accounts
          </button>{" "}
          to link them.
        </p>
      )}
    </div>
  )
}
