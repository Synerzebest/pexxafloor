"use client"

import { useEffect, useState } from "react"
import { Briefcase } from "lucide-react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useUI } from "@/context/UIContext"
import { supabase } from "@/lib/supabaseClient"

const ProBadge = () => {
  const locale = useLocale()
  const tc = useTranslations("Common")
  const { drawerOpen } = useUI()

  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState<boolean>(false)

  // fetch user
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsPro(false)
        setLoading(false)
        return
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error fetching profile:", error)
        setIsPro(false)
      } else {
        setIsPro(Boolean(profile?.is_pro))
      }

      setLoading(false)
    }

    fetchUserAndProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUserAndProfile()
    })

    return () => subscription.unsubscribe()
  }, [])


  // Rien afficher si l'utilisateur connecté est PRO, si le menu mobile est ouvert ou si fetch en cours
  if (loading) return null
  if (drawerOpen) return null
  if (isPro) return null 

  return (
    <Link
      href={`/${locale}/pro`}
      className="fixed top-24 sm:top-32 right-0 z-30 group"
    >
      <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-500 px-4 py-3 rounded-l-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:pr-6 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-white" />
        <div className="flex flex-col text-white">
          <span className="font-bold text-sm">{tc("proArea")}</span>
          <span className="text-xs opacity-90">{tc("exclusiveDiscounts")}</span>
        </div>
      </div>
    </Link>
  )
}

export default ProBadge
