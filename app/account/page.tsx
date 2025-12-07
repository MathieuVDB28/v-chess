'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Mail, Lock, User, LogOut, FloppyDisk, Trophy } from 'iconoir-react'

export default function Account() {
    const { data: session, status } = useSession()
    const [userData, setUserData] = useState({
        email: session?.user?.email || '',
        chesscom_username: session?.user?.chesscom_username || '',
        lichess_username: session?.user?.lichess_username || '',
    })
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [focusedField, setFocusedField] = useState<string | null>(null)
    const [success, setSuccess] = useState('')

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setSuccess('')

        // Simuler une sauvegarde (à implémenter avec votre API)
        setTimeout(() => {
            setIsLoading(false)
            setSuccess('Profil mis à jour avec succès !')
            setTimeout(() => setSuccess(''), 3000)
        }, 1000)
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (passwordData.new !== passwordData.confirm) {
            alert('Les mots de passe ne correspondent pas')
            return
        }

        setIsLoading(true)
        // Implémenter la logique de changement de mot de passe
        setTimeout(() => {
            setIsLoading(false)
            setPasswordData({ current: '', new: '', confirm: '' })
            setSuccess('Mot de passe modifié avec succès !')
            setTimeout(() => setSuccess(''), 3000)
        }, 1000)
    }

    const handleSignOut = async () => {
        await signOut({
            redirect: true,
            callbackUrl: '/'
        })
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
                        <User className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">Mon Compte</h1>
                    <p className="text-foreground/60 text-lg">Gérez vos informations personnelles et préférences</p>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="mb-6 p-4 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
                        <div className="w-1 h-12 bg-primary rounded-full" />
                        <p className="text-sm font-medium">{success}</p>
                    </div>
                )}

                {/* Profile Section */}
                <div className="mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-150">
                    <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-2xl p-8 hover:border-primary/20 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <User className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">Informations du Profil</h2>
                                <p className="text-foreground/60 text-sm">Mettez à jour vos informations personnelles</p>
                            </div>
                        </div>

                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-foreground/80">
                                    Email
                                </label>
                                <div className="relative group">
                                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                                        focusedField === 'email' ? 'text-primary' : 'text-foreground/40'
                                    }`}>
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={userData.email}
                                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full pl-11 pr-4 py-3 bg-background border-2 border-input rounded-lg
                                                 text-foreground placeholder:text-foreground/30
                                                 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                 transition-all duration-300"
                                        placeholder="votre@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Chess Usernames */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="chesscom" className="block text-sm font-medium text-foreground/80">
                                        Pseudo Chess.com
                                    </label>
                                    <div className="relative group">
                                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                                            focusedField === 'chesscom' ? 'text-primary' : 'text-foreground/40'
                                        }`}>
                                            <Trophy className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="chesscom"
                                            type="text"
                                            value={userData.chesscom_username}
                                            onChange={(e) => setUserData({ ...userData, chesscom_username: e.target.value })}
                                            onFocus={() => setFocusedField('chesscom')}
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full pl-11 pr-4 py-3 bg-background border-2 border-input rounded-lg
                                                     text-foreground placeholder:text-foreground/30
                                                     focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                     transition-all duration-300"
                                            placeholder="votre_pseudo"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="lichess" className="block text-sm font-medium text-foreground/80">
                                        Pseudo Lichess
                                    </label>
                                    <div className="relative group">
                                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                                            focusedField === 'lichess' ? 'text-primary' : 'text-foreground/40'
                                        }`}>
                                            <Trophy className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="lichess"
                                            type="text"
                                            value={userData.lichess_username}
                                            onChange={(e) => setUserData({ ...userData, lichess_username: e.target.value })}
                                            onFocus={() => setFocusedField('lichess')}
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full pl-11 pr-4 py-3 bg-background border-2 border-input rounded-lg
                                                     text-foreground placeholder:text-foreground/30
                                                     focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                     transition-all duration-300"
                                            placeholder="votre_pseudo"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary text-background font-semibold py-3 px-4 rounded-lg
                                         hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20
                                         focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                                         disabled:opacity-50 disabled:cursor-not-allowed
                                         transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                                         flex items-center justify-center gap-2 group"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                        <span>Sauvegarde...</span>
                                    </>
                                ) : (
                                    <>
                                        <FloppyDisk className="w-5 h-5" />
                                        <span>Sauvegarder les modifications</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Password Section */}
                <div className="mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                    <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-2xl p-8 hover:border-primary/20 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Lock className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">Sécurité</h2>
                                <p className="text-foreground/60 text-sm">Modifiez votre mot de passe</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            {/* Current Password */}
                            <div className="space-y-2">
                                <label htmlFor="current-password" className="block text-sm font-medium text-foreground/80">
                                    Mot de passe actuel
                                </label>
                                <div className="relative group">
                                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                                        focusedField === 'current-password' ? 'text-primary' : 'text-foreground/40'
                                    }`}>
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="current-password"
                                        type="password"
                                        value={passwordData.current}
                                        onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                        onFocus={() => setFocusedField('current-password')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full pl-11 pr-4 py-3 bg-background border-2 border-input rounded-lg
                                                 text-foreground placeholder:text-foreground/30
                                                 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                 transition-all duration-300"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <label htmlFor="new-password" className="block text-sm font-medium text-foreground/80">
                                    Nouveau mot de passe
                                </label>
                                <div className="relative group">
                                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                                        focusedField === 'new-password' ? 'text-primary' : 'text-foreground/40'
                                    }`}>
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="new-password"
                                        type="password"
                                        value={passwordData.new}
                                        onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                        onFocus={() => setFocusedField('new-password')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full pl-11 pr-4 py-3 bg-background border-2 border-input rounded-lg
                                                 text-foreground placeholder:text-foreground/30
                                                 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                 transition-all duration-300"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground/80">
                                    Confirmer le mot de passe
                                </label>
                                <div className="relative group">
                                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                                        focusedField === 'confirm-password' ? 'text-primary' : 'text-foreground/40'
                                    }`}>
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="confirm-password"
                                        type="password"
                                        value={passwordData.confirm}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                        onFocus={() => setFocusedField('confirm-password')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full pl-11 pr-4 py-3 bg-background border-2 border-input rounded-lg
                                                 text-foreground placeholder:text-foreground/30
                                                 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                 transition-all duration-300"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/* Update Password Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary text-background font-semibold py-3 px-4 rounded-lg
                                         hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20
                                         focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                                         disabled:opacity-50 disabled:cursor-not-allowed
                                         transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                                         flex items-center justify-center gap-2 group"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                        <span>Mise à jour...</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-5 h-5" />
                                        <span>Changer le mot de passe</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-500">
                    <button
                        onClick={handleSignOut}
                        className="w-full bg-destructive/10 text-destructive font-semibold py-3 px-4 rounded-lg
                                   border-2 border-destructive/20 hover:bg-destructive/20 hover:border-destructive/30
                                   focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 focus:ring-offset-background
                                   transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                                   flex items-center justify-center gap-2 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <span>Se déconnecter</span>
                    </button>
                </div>
            </div>
        </div>
    )
}