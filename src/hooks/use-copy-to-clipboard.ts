import { copyText } from "@/lib/clipboard"
import { useToast } from "./use-toast"

export function useCopyToClipboard() {
  const { toast } = useToast()

  const copyToClipboard = async (text: string, message = "Copied to clipboard!") => {
    const success = await copyText(text)
    toast({ description: success ? message : "Copy denied. Select the output and copy manually.", variant: success ? "default" : "destructive" })
    return success
  }

  return { copyToClipboard }
}
