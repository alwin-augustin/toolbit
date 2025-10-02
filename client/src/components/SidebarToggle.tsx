import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useSidebar } from "@/hooks/use-sidebar"

export function SidebarToggle() {
  const { isOpen, toggle } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={toggle}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <Menu className="h-5 w-5" />
      )}
      <span className="sr-only">{isOpen ? "Close" : "Open"} sidebar</span>
    </Button>
  )
}
