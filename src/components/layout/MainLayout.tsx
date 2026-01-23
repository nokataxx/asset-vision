import type { ReactNode } from 'react'
import { Header } from './Header'

interface MainLayoutProps {
  inputArea: ReactNode
  outputArea: ReactNode
}

export function MainLayout({ inputArea, outputArea }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex flex-col gap-6">
          {/* 入力エリア（上部） */}
          <div className="space-y-4">
            {inputArea}
          </div>

          {/* シミュレーション結果（下部） */}
          <div className="space-y-4">
            {outputArea}
          </div>
        </div>
      </main>
    </div>
  )
}
