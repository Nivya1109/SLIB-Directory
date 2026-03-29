'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export function NavbarAdminSection() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div className="hidden md:flex items-center gap-1">
        <Link
          href="/admin"
          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
        >
          Admin
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/admin/login"
      className="hidden md:block text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
    >
      Admin Login
    </Link>
  )
}
