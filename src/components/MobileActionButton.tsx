import { useState } from "react"
import { Plus, X, Search, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileAction {
    icon: React.ReactNode
    label: string
    onClick: () => void
}

interface MobileActionButtonProps {
    actions?: MobileAction[]
}

export function MobileActionButton({ actions }: MobileActionButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    const defaultActions: MobileAction[] = [
        {
            icon: <Search className="h-4 w-4" />,
            label: "Search Tools",
            onClick: () => {
                setIsOpen(false)
                document.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
                )
            },
        },
        {
            icon: <ArrowUp className="h-4 w-4" />,
            label: "Back to Top",
            onClick: () => {
                setIsOpen(false)
                window.scrollTo({ top: 0, behavior: "smooth" })
            },
        },
    ]

    const allActions = actions ? [...actions, ...defaultActions] : defaultActions

    return (
        <div className="fixed bottom-6 right-6 z-30 lg:hidden">
            {/* Action menu */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 flex flex-col gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
                    {allActions.map((action, i) => (
                        <button
                            key={i}
                            onClick={action.onClick}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-background border border-border shadow-lg text-sm font-medium whitespace-nowrap"
                            aria-label={action.label}
                        >
                            {action.icon}
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200 active:scale-95",
                    isOpen && "rotate-45"
                )}
                aria-label={isOpen ? "Close actions" : "Open actions"}
                aria-expanded={isOpen}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </button>
        </div>
    )
}
