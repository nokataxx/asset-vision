import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LoginDialog } from '@/components/auth/LoginDialog'
import { SignUpDialog } from '@/components/auth/SignUpDialog'
import { LogOut, User } from 'lucide-react'

export function Header() {
  const { user, signOut } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [signUpOpen, setSignUpOpen] = useState(false)

  const handleSwitchToSignUp = () => {
    setLoginOpen(false)
    setSignUpOpen(true)
  }

  const handleSwitchToLogin = () => {
    setSignUpOpen(false)
    setLoginOpen(true)
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          金融資産シミュレーター
        </h1>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4 mr-1" />
                ログアウト
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLoginOpen(true)}
            >
              ログイン
            </Button>
          )}
        </div>
      </div>

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToSignUp={handleSwitchToSignUp}
      />

      <SignUpDialog
        open={signUpOpen}
        onOpenChange={setSignUpOpen}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </header>
  )
}
