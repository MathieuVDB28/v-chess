"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        chesscom_username: '',
        lichess_username: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const router = useRouter();

    const handleChange = (e:any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (e:any) => {
        setTermsAccepted(e.target.checked);
    };

    const handleSubmit = async (e:any) => {
        e.preventDefault();

        // Validation côté client
        if (!formData.email || !formData.password) {
            setError('Tous les champs sont obligatoires');
            return;
        }

        if (!termsAccepted) {
            setError('Vous devez accepter les conditions générales');
            return;
        }

        if (formData.password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Appel à l'API d'inscription
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    chesscom_username: formData.chesscom_username || "", // Valeur par défaut vide
                    lichess_username: formData.lichess_username || ""    // Valeur par défaut vide
                }),
            });

            const data = await response.json();
            console.log('data : ' + data)

            if (!response.ok) {
                throw new Error(data.message || 'Une erreur est survenue');
            }

            // Redirection vers la page de connexion après inscription réussie
            router.push('/auth/signin?success=Account has been created');

        } catch (error:any) {
            setError(error?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
                <a href="#" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
                    <img className="w-8 h-8 mr-2" src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/logo.svg"
                         alt="logo"/>
                    V-chess
                </a>
                <div
                    className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                            Create an account
                        </h1>
                        {error && (
                            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                                {error}
                            </div>
                        )}
                        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email"
                                       className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Your email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="name@email.com"
                                    required
                                />
                            </div>

                            {/* Chess.com username field with icon */}
                            <div>
                                <label htmlFor="chesscom_username"
                                       className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    <div className="flex items-center">
                                        <img
                                            src="https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/SamCopeland/phpmeXx6V.png"
                                            alt="Chess.com"
                                            className="w-5 h-5 mr-2"
                                        />
                                        Chess.com username
                                    </div>
                                </label>
                                <input
                                    type="text"
                                    name="chesscom_username"
                                    id="chesscom_username"
                                    value={formData.chesscom_username}
                                    onChange={handleChange}
                                    placeholder="chesscom_user"
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                />
                            </div>

                            {/* Lichess username field with icon */}
                            <div>
                                <label htmlFor="lichess_username"
                                       className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    <div className="flex items-center">
                                        <img
                                            src="https://lichess1.org/assets/logo/lichess-favicon-32.png"
                                            alt="Lichess"
                                            className="w-5 h-5 mr-2"
                                        />
                                        Lichess username
                                    </div>
                                </label>
                                <input
                                    type="text"
                                    name="lichess_username"
                                    id="lichess_username"
                                    value={formData.lichess_username}
                                    onChange={handleChange}
                                    placeholder="lichess_user"
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="password"
                                       className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="terms"
                                        aria-describedby="terms"
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={handleCheckboxChange}
                                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                                        required
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="terms" className="font-light text-gray-500 dark:text-gray-300">
                                        I accept the <a
                                        className="font-medium text-primary-600 hover:underline dark:text-primary-500"
                                        href="#">Terms and Conditions</a>
                                    </label>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full text-white bg-primary-600 bg-primary rounded-lg text-sm px-5 py-2.5 text-center"
                            >
                                {loading ? 'Création en cours...' : 'Create an account'}
                            </button>
                            <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                                Already have an account? <a href="/auth/signin"
                                 className="font-medium text-primary-600 text-primary hover:underline">
                                Login
                            </a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}