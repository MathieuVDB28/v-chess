'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignIn() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                // Redirection après connexion réussie
                router.push('/dashboard');
                router.refresh();
            }
        } catch (error) {
            setError('Une erreur s\'est produite lors de la connexion');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow-md">
            <h1 className="text-2xl font-bold mb-6 text-center">Connexion</h1>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="email" className="block mb-2 text-sm font-medium">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="password" className="block mb-2 text-sm font-medium">
                        Mot de passe
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                </button>
            </form>

            <div className="mt-4 text-center">
                <p className="text-sm">
                    Vous n'avez pas de compte ?{' '}
                    <Link href="/auth/signup" className="text-blue-600 hover:underline">
                        S'inscrire
                    </Link>
                </p>
            </div>
        </div>
    );
}