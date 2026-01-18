"use client"

import { createContext, useContext, useState } from "react"

type UIContextType = {
  drawerOpen: boolean
  setDrawerOpen: (v: boolean) => void
}

const UIContext = createContext<UIContextType | null>(null)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <UIContext.Provider value={{ drawerOpen, setDrawerOpen }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error("useUI must be used inside UIProvider")
  return ctx
}
