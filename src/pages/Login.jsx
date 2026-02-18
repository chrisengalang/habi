import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Invalid email or password. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4 relative overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-habi-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-habi-gold/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 bg-white rounded-3xl shadow-xl shadow-habi-primary/10 mb-6 overflow-hidden w-24 h-24 mx-auto animate-in zoom-in-50 duration-500">
                        <img src="/logo.svg" alt="habi logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter lowercase">
                        habi
                    </h1>
                </div>

                <div className="enterprise-card p-8 lg:p-10 bg-[var(--bg-secondary)]/80 backdrop-blur-xl border border-[var(--border-color)]">
                    {error && (
                        <div className="mb-6 p-4 bg-habi-error/10 border border-habi-error/20 rounded-xl flex items-center gap-3 text-habi-error text-sm font-medium animate-in slide-in-from-top-2">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                                Email Address
                            </label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    required
                                    className="enterprise-input pl-12 bg-[var(--bg-primary)]/50 focus:bg-[var(--bg-primary)] transition-all"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-color)] transition-colors" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    required
                                    className="enterprise-input pl-12 bg-[var(--bg-primary)]/50 focus:bg-[var(--bg-primary)] transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-color)] transition-colors" size={18} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="enterprise-button-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 group transition-all"
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-[var(--border-color)] text-center">
                        <p className="text-[var(--text-secondary)] text-sm font-medium">
                            First time here?{' '}
                            <Link to="/register" className="text-[var(--accent-gold)] hover:brightness-110 font-bold transition-colors">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
