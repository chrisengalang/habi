import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Edit2, Check, X, PiggyBank } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = { name: '', targetAmount: '', savedAmount: '', targetDate: '' };

function GoalCard({ goal, onDelete, onEdit, onContribute }) {
    const [contributionAmount, setContributionAmount] = useState('');
    const [contributing, setContributing] = useState(false);
    const [saving, setSaving] = useState(false);

    const progress = goal.targetAmount > 0
        ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
        : 0;
    const isComplete = goal.savedAmount >= goal.targetAmount;

    const daysRemaining = goal.targetDate
        ? Math.ceil((new Date(goal.targetDate + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    const handleContribute = async () => {
        const amount = parseFloat(contributionAmount);
        if (!amount || amount <= 0) return;
        setSaving(true);
        try {
            await onContribute(goal.id, amount);
            setContributionAmount('');
            setContributing(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="enterprise-card flex flex-col bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-gold)]/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-[var(--accent-gold)]/5">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card-header)]">
                <h3 className="font-bold text-sm tracking-wide text-[var(--text-primary)] truncate flex items-center gap-2">
                    <Target size={14} className="shrink-0 text-[var(--accent-gold)]" />
                    {goal.name}
                </h3>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                        onClick={() => onEdit(goal)}
                        className="p-1.5 text-[var(--text-light)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-sm transition-colors"
                        title="Edit goal"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(goal.id)}
                        className="p-1.5 text-[var(--text-light)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-sm transition-colors"
                        title="Delete goal"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex-1 space-y-4">
                {/* Progress Bar */}
                <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="text-[var(--text-secondary)]">Progress</span>
                        <span className={isComplete ? 'text-[var(--color-success)]' : 'text-[var(--text-primary)]'}>
                            {progress.toFixed(0)}%{isComplete ? ' ✓' : ''}
                        </span>
                    </div>
                    <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-[var(--color-success)]' : 'bg-[var(--accent-gold)]'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Amounts */}
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-light)]">Saved</p>
                        <p className="text-xl font-extrabold text-[var(--text-primary)] font-heading">
                            ${goal.savedAmount.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-light)]">Target</p>
                        <p className="text-sm font-bold text-[var(--text-secondary)]">
                            ${goal.targetAmount.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Remaining amount */}
                {!isComplete && (
                    <p className="text-xs text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">
                            ${(goal.targetAmount - goal.savedAmount).toLocaleString()}
                        </span> still needed
                    </p>
                )}

                {/* Target Date */}
                {goal.targetDate && (
                    <p className={`text-xs font-medium ${
                        daysRemaining !== null && daysRemaining < 0
                            ? 'text-[var(--color-error)]'
                            : daysRemaining !== null && daysRemaining <= 30
                                ? 'text-[var(--color-warning)]'
                                : 'text-[var(--text-secondary)]'
                    }`}>
                        {daysRemaining !== null && daysRemaining < 0
                            ? `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'}`
                            : daysRemaining === 0
                                ? 'Due today'
                                : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`}
                        {' · '}
                        {new Date(goal.targetDate + 'T00:00:00').toLocaleDateString('en-CA', {
                            month: 'short', day: 'numeric', year: 'numeric'
                        })}
                    </p>
                )}
            </div>

            {/* Footer */}
            {isComplete ? (
                <div className="p-3 bg-[var(--color-success)]/10 border-t border-[var(--color-success)]/20 text-center">
                    <span className="text-xs font-bold text-[var(--color-success)] uppercase tracking-widest">Goal Reached!</span>
                </div>
            ) : (
                <div className="p-4 bg-[var(--bg-primary)]/50 border-t border-[var(--border-color)]">
                    {contributing ? (
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Amount to add..."
                                value={contributionAmount}
                                onChange={e => setContributionAmount(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleContribute();
                                    if (e.key === 'Escape') { setContributing(false); setContributionAmount(''); }
                                }}
                                className="enterprise-input py-1.5 px-3 text-sm flex-1"
                                autoFocus
                                min="0"
                                step="any"
                            />
                            <button
                                onClick={handleContribute}
                                disabled={saving}
                                className="p-1.5 text-[var(--color-success)] hover:bg-[var(--color-success)]/10 rounded-sm transition-colors disabled:opacity-50"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                onClick={() => { setContributing(false); setContributionAmount(''); }}
                                className="p-1.5 text-[var(--text-light)] hover:bg-[var(--bg-primary)] rounded-sm transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setContributing(true)}
                            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 py-2 rounded-sm transition-colors"
                        >
                            <Plus size={14} /> Log Contribution
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function Goals() {
    const [goals, setGoals] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        setLoading(true);
        api.getGoals(user.uid)
            .then(data => { if (!cancelled) setGoals(data); })
            .catch(err => console.error("Error fetching goals:", err))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                const updated = await api.updateGoal(user.uid, editingId, form);
                setGoals(prev => prev.map(g => g.id === editingId ? { ...g, ...updated } : g));
            } else {
                const created = await api.addGoal(user.uid, form);
                setGoals(prev => [...prev, created]);
            }
            setForm(EMPTY_FORM);
            setEditingId(null);
        } catch (error) {
            console.error("Error saving goal:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (goal) => {
        setEditingId(goal.id);
        setForm({
            name: goal.name,
            targetAmount: goal.targetAmount.toString(),
            savedAmount: goal.savedAmount.toString(),
            targetDate: goal.targetDate || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this goal?")) return;
        try {
            await api.deleteGoal(user.uid, id);
            setGoals(prev => prev.filter(g => g.id !== id));
        } catch (error) {
            console.error("Error deleting goal:", error);
        }
    };

    const handleContribute = async (id, amount) => {
        try {
            await api.logGoalContribution(user.uid, id, amount);
            setGoals(prev => prev.map(g =>
                g.id === id ? { ...g, savedAmount: g.savedAmount + amount } : g
            ));
        } catch (error) {
            console.error("Error logging contribution:", error);
        }
    };

    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-heading font-extrabold text-[var(--text-primary)] tracking-tight">
                        Savings Goals
                    </h2>
                    <p className="text-sm lg:text-base text-[var(--text-secondary)] mt-1 font-medium">
                        Set targets and track your progress toward the things that matter.
                    </p>
                </div>
                {goals.length > 0 && (
                    <div className="text-right shrink-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-light)]">Total Saved</p>
                        <p className="text-2xl font-extrabold font-heading text-[var(--accent-gold)]">
                            ${totalSaved.toLocaleString()}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                            of ${totalTarget.toLocaleString()} across {goals.length} goal{goals.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </header>

            {/* Add / Edit Form */}
            <section className="enterprise-card p-6 lg:p-8 bg-[var(--bg-secondary)]">
                <h3 className="text-lg font-heading font-bold text-[var(--text-primary)] mb-6">
                    {editingId ? 'Edit Goal' : 'New Savings Goal'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-1.5">
                                Goal Name <span className="text-[var(--color-error)]">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Emergency Fund, Vacation, Laptop"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className="enterprise-input text-sm py-3"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-1.5">
                                Target Amount ($) <span className="text-[var(--color-error)]">*</span>
                            </label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={form.targetAmount}
                                onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                                className="enterprise-input text-sm py-3"
                                required
                                min="1"
                                step="any"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-1.5">
                                {editingId ? 'Current Saved Amount ($)' : 'Starting Amount ($)'}
                            </label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={form.savedAmount}
                                onChange={e => setForm(f => ({ ...f, savedAmount: e.target.value }))}
                                className="enterprise-input text-sm py-3"
                                min="0"
                                step="any"
                            />
                        </div>
                        <div className="sm:col-span-2 sm:w-1/2">
                            <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-1.5">
                                Target Date <span className="text-[var(--text-light)]">(optional)</span>
                            </label>
                            <input
                                type="date"
                                value={form.targetDate}
                                onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                                className="enterprise-input text-sm py-3"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="enterprise-button-primary px-8 text-sm disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : editingId ? 'Update Goal' : 'Add Goal'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="enterprise-button-secondary px-6 text-sm"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {/* Goals Grid */}
            {loading && goals.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-secondary)]">Loading goals...</div>
            ) : goals.length === 0 ? (
                <div className="enterprise-card p-12 flex flex-col items-center gap-4 text-center">
                    <PiggyBank size={48} className="text-[var(--text-light)]" />
                    <div>
                        <p className="font-bold text-[var(--text-primary)]">No goals yet</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                            Create your first savings goal above to get started.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {goals.map(goal => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onContribute={handleContribute}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Goals;
