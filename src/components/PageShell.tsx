import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface PageShellProps {
  title: string
  backTo?: string
  backLabel?: string
  children?: ReactNode
}

/** 설정형 페이지 셸 — 본문 색상은 자식에서 제어 (가이드: 폼 느낌 완화) */
export function PageShell({
  title,
  backTo = '/',
  backLabel = '홈',
  children,
}: PageShellProps) {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-[#FAFBFC] px-6 py-6">
      <Link
        to={backTo}
        className="mb-5 inline-flex min-h-11 items-center text-sm font-medium text-[#7A7F8A] underline-offset-4 hover:text-[#111111]"
      >
        ← {backLabel}
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-[#111111]">{title}</h1>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  )
}
