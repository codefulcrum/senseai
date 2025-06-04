"use client"

import { cn } from "@/lib/utils"
import { FileText, Link2, Layers } from "lucide-react"

interface SideNavigationProps {
  activeTab: "all" | "documents" | "urls"
  onTabChange: (tab: "all" | "documents" | "urls") => void
}

export function SideNavigation({ activeTab, onTabChange }: SideNavigationProps) {
  return (
    <div className="w-full md:w-56 bg-gray-900 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white">Content Types</h3>
      </div>
      <nav className="p-2 space-y-1">
        <button
          onClick={() => onTabChange("all")}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
            activeTab === "all" ? "bg-primary text-white" : "text-gray-400 hover:text-white hover:bg-gray-800",
          )}
        >
          <Layers size={18} />
          <span>All Content</span>
        </button>
        <button
          onClick={() => onTabChange("documents")}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
            activeTab === "documents" ? "bg-primary text-white" : "text-gray-400 hover:text-white hover:bg-gray-800",
          )}
        >
          <FileText size={18} />
          <span>Documents</span>
        </button>
        <button
          onClick={() => onTabChange("urls")}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
            activeTab === "urls" ? "bg-primary text-white" : "text-gray-400 hover:text-white hover:bg-gray-800",
          )}
        >
          <Link2 size={18} />
          <span>URLs</span>
        </button>
      </nav>
    </div>
  )
}
