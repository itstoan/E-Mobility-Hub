import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button, FormField, Input } from '../../../components/ui';
import { BrandBoltIcon } from '../../../layouts/NavIcons';
import { getDefaultHomeByRole } from '../../../routes/paths';
import { useAuthStore } from '../../../stores/useAuthStore';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const login = useAuthStore((state) => state.login);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const locationState = location.state as {
        from?: { pathname?: string };
        authError?: boolean;
    } | null;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage(null);

        if (!email.trim() || !password) {
            setErrorMessage('Sign-in failed. Check your credentials and try again.');
            return;
        }

        setSubmitting(true);
        try {
            const user = await login(email, password);
            const targetPath =
                locationState?.from?.pathname || getDefaultHomeByRole(user.role);
            navigate(targetPath, { replace: true });
        } catch {
            setErrorMessage('Sign-in failed. Check your credentials and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid min-h-screen bg-surface-page font-sans lg:grid-cols-2">
            {/* Cột trái: Brand Hero theo thiết kế Figma UC00 */}
            <section className="relative flex flex-col justify-center overflow-hidden bg-sidebar-bg px-8 py-12 text-white sm:px-14 lg:py-16">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-primary/25 blur-3xl"
                />

                <div className="relative z-10 mx-auto w-full max-w-md space-y-6">
                    <div className="flex items-center gap-3">
                        <BrandBoltIcon className="h-6 w-6 text-brand-accent" />
                        <span className="font-brand text-sm font-semibold uppercase tracking-widest text-brand-accent-soft">
                            SMART E-MOBILITY HUB
                        </span>
                    </div>

                    <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                        Powering a{' '}
                        <span className="text-brand-accent">smarter</span>{' '}
                        journey.
                    </h1>

                    <p className="font-sans text-base font-normal italic text-text-subtle">
                        Move Smarter. Charge Cleaner. Connect Better
                    </p>
                </div>
            </section>

            {/* Cột phải: Form đăng nhập */}
            <section className="flex items-center justify-center px-6 py-12 sm:px-12">
                <div className="w-full max-w-md space-y-7">
                    <div className="space-y-1.5">
                        <h2 className="font-heading text-3xl font-bold text-text-primary">
                            Welcome back
                        </h2>
                        <p className="font-sans text-sm font-normal text-text-secondary">
                            Sign in to your account
                        </p>
                    </div>

                    {locationState?.authError && !errorMessage && (
                        <div
                            role="alert"
                            className="rounded-lg border border-status-danger-border bg-status-danger-surface px-4 py-3 font-sans text-sm font-normal text-status-danger-text"
                        >
                            Session could not be restored. Please sign in again.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <FormField id="login-email" label="Email">
                            <Input
                                id="login-email"
                                type="email"
                                autoComplete="email"
                                placeholder="Enter your email"
                                value={email}
                                invalid={Boolean(errorMessage)}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errorMessage) setErrorMessage(null);
                                }}
                            />
                        </FormField>

                        <FormField id="login-password" label="Password">
                            <Input
                                id="login-password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                value={password}
                                invalid={Boolean(errorMessage)}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errorMessage) setErrorMessage(null);
                                }}
                            />
                        </FormField>

                        <div className="space-y-2.5 pt-1">
                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={submitting}
                                className="w-full font-heading text-sm font-semibold"
                            >
                                Sign in
                            </Button>

                            {errorMessage && (
                                <p
                                    role="alert"
                                    className="font-sans text-sm font-normal text-status-danger-text"
                                >
                                    {errorMessage}
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </section>
        </div>
    );
}