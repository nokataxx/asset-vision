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

interface SignUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToLogin: () => void
}

export function SignUpDialog({ open, onOpenChange, onSwitchToLogin }: SignUpDialogProps) {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">新規登録</DialogTitle>
          <DialogDescription className="text-xs text-gray-600 mb-1">
            アカウントを作成してデータを保存できるようにしましょう
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              確認メールを送信しました。メールのリンクをクリックして登録を完了してください。
            </p>
            <Button
              variant="link"
              onClick={handleClose}
              className="mt-2"
            >
              閉じる
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-xs mb-1">メールアドレス</Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-xs mb-1">パスワード</Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs mb-1">パスワード（確認）</Label>
              <Input
                id="confirm-password"
                type="password"
                className="mb-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="パスワードを再入力"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? '登録中...' : '登録'}
              </Button>

              <div className="text-center text-xs">
                <span className="text-muted-foreground">すでにアカウントをお持ちの方は</span>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto ml-1 text-xs"
                  onClick={onSwitchToLogin}
                >
                  ログイン
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
