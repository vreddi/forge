import { DriveUI } from "~/components/drive-ui"
import { Toaster } from "~/components/ui/toaster"

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-200 dark">
      <DriveUI />
      <Toaster />
    </main>
  )
}

