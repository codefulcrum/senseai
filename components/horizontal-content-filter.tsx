"use client"

import { cn } from "@/lib/utils"
import { FileText, Link2, Layers } from "lucide-react"

interface HorizontalContentFilterProps {
  activeFilter: "all" | "documents" | "urls"
  onFilterChange: (filter: "all" | "documents" | "urls") => void
}

export function HorizontalContentFilter({ activeFilter, onFilterChange }: HorizontalContentFilterProps) {
  return (
    <div className="flex space-x-2 mb-4">
      <button
        onClick={() => onFilterChange("all")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors",
          activeFilter === "all"
            ? "bg-primary text-white"
            : "bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700",
        )}
      >
        <Layers size={16} />
        <span>All</span>
      </button>
      <button
        onClick={() => onFilterChange("documents")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors",
          activeFilter === "documents"
            ? "bg-primary text-white"
            : "bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700",
        )}
      >
        <FileText size={16} />
        <span>Documents</span>
      </button>
      <button
        onClick={() => onFilterChange("urls")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors",
          activeFilter === "urls"
            ? "bg-primary text-white"
            : "bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700",
        )}
      >
        <Link2 size={16} />
        <span>URLs</span>
      </button>
    </div>
  )
}
