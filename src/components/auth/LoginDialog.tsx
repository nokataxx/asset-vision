import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignUp: () => void
}

export function LoginDialog({ open, onOpenChange, onSwitchToSignUp }: LoginDialogProps) {
  const { signIn, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
    } else {
      onOpenChange(false)
      setEmail('')
      setPassword('')
    }

    setLoading(false)
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('パスワードリセット用のメールアドレスを入力してください')
      return
    }

    setLoading(true)
    const { error } = await resetPassword(email)

    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">ログイン</DialogTitle>
          <DialogDescription className="text-xs text-gray-600 mb-1">
            メールアドレスとパスワードでログインしてください
          </DialogDescription>
        </DialogHeader>

        {resetSent ? (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              パスワードリセット用のメールを送信しました。メールをご確認ください。
            </p>
            <Button
              variant="link"
              onClick={() => setResetSent(false)}
              className="mt-2"
            >
              ログイン画面に戻る
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs mb-1">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs mb-1">パスワード</Label>
              <Input
                id="password"
                type="password"
                className="mb-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'ログイン中...' : 'ログイン'}
              </Button>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-xs"
                  onClick={handleResetPassword}
                  disabled={loading}
                >
                  パスワードを忘れた方
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-xs"
                  onClick={onSwitchToSignUp}
                >
                  新規登録
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
