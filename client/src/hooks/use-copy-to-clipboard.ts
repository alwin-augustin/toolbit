import { useToast } from "./use-toast"

export function useCopyToClipboard() {
  const { toast } = useToast()

  const copyToClipboard = (text: string, message = "Copied to clipboard!") => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({ description: message })
      },
      () => {
        toast({
          description: "Failed to copy to clipboard",
          variant: "destructive"
        })
      }
    )
  }

  return { copyToClipboard }
}
