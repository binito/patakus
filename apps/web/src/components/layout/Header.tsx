'use client';

import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/20 bg-white/10 backdrop-blur-xl px-6">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-white/60">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-white/70 hover:text-white hover:bg-white/10">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
