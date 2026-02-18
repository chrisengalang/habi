import { useState, useEffect } from 'react';
import { Wallet, Receipt, Edit2, Check, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Budgets({ selectedMonth }) {
    const [budget, setBudget] = useState(null);
    const [newItem, setNewItem] = useState({ name: '', amount: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', amount: '' });
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (selectedMonth && user) fetchBudget();
    }, [selectedMonth, user]);

    const fetchBudget = async () => {
        setLoading(true);
        try {
            const month = selectedMonth.getMonth() + 1;
            const year = selectedMonth.getFullYear();
            const response = await api.get('/budgets', { userId: user.uid, params: { month, year } });
            setBudget(response.data);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setBudget(null);
            } else {
                console.error("Error fetching budget:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    const createBudgetHelper = async () => {
        try {
            const month = selectedMonth.getMonth() + 1;
            const year = selectedMonth.getFullYear();
            const response = await api.post('/budgets', { month, year }, { userId: user.uid });
            setBudget(response.data);
        } catch (error) {
            console.error("Error creating budget:", error);
        }
    };

    const handleCopyPrevious = async () => {
        try {
            const month = selectedMonth.getMonth() + 1;
            const year = selectedMonth.getFullYear();
            const response = await api.post('/budgets/copy-previous', { month, year }, { userId: user.uid });
            setBudget(response.data);
            alert("Items copied from previous month!");
        } catch (error) {
            console.error("Error copying budget:", error);
            alert(error.response?.data?.message || "Could not find a budget from the previous month to copy from.");
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!budget) return;

        try {
            const itemToSave = {
                ...newItem,
                budgetId: budget.id
            };
            const response = await api.post('/budget-items', itemToSave, { userId: user.uid });
            const newItems = budget.budgetItems ? [...budget.budgetItems, response.data] : [response.data];
            setBudget({ ...budget, budgetItems: newItems });
            setNewItem({ name: '', amount: '' });
        } catch (error) {
            console.error("Error adding budget item:", error);
        }
    };

    const startEditing = (item) => {
        setEditingId(item.id);
        setEditForm({ name: item.name, amount: item.amount });
    };

    const cancelEditing = () => {
        setEditingId(null);
    };

    const handleUpdateItem = async (id) => {
        try {
            const response = await api.put(`/budget-items/${id}`, editForm, { userId: user.uid });
            const newItems = budget.budgetItems.map(item =>
                item.id === id ? { ...item, name: response.data.name, amount: response.data.amount } : item
            );
            setBudget({ ...budget, budgetItems: newItems });
            setEditingId(null);
        } catch (error) {
            console.error("Error updating budget item:", error);
        }
    };

    const deleteItem = async (id) => {
        if (!window.confirm("Are you sure you want to delete this budget item?")) return;
        try {
            await api.delete(`/budget-items/${id}`, { userId: user.uid });
            const newItems = budget.budgetItems.filter(item => item.id !== id);
            setBudget({ ...budget, budgetItems: newItems });
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

    if (loading) return <div className="p-10 text-center text-[var(--text-secondary)]">Loading your budget...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-heading font-extrabold text-[var(--text-primary)] tracking-tight">
                        Budgets
                    </h2>
                    <p className="text-sm lg:text-base text-[var(--text-secondary)] mt-1 font-medium italic">Track and manage your spending limits.</p>
                </div>
            </header>

            {!budget ? (
                <div className="enterprise-card p-6 sm:p-8 lg:p-16 text-center space-y-6 lg:space-y-8 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)]">
                    <div className="space-y-3 sm:space-y-4">
                        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-habi-primary/10 rounded-sm flex items-center justify-center text-habi-primary shadow-inner">
                            <Wallet size={28} />
                        </div>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-heading font-bold text-[var(--text-primary)]">Start your budget month</h3>
                        <p className="text-[var(--text-secondary)] max-w-sm sm:max-w-md mx-auto text-xs sm:text-sm lg:text-lg">
                            Take control of your finances for {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-3 lg:gap-6">
                        <button
                            onClick={createBudgetHelper}
                            className="enterprise-button-primary flex items-center justify-center space-x-2 px-6 lg:px-10 py-3 sm:py-2.5"
                        >
                            <span className="text-sm">🚀 Start Fresh</span>
                        </button>
                        <button
                            onClick={handleCopyPrevious}
                            className="enterprise-button-secondary flex items-center justify-center space-x-2 px-6 lg:px-10 py-3 sm:py-2.5"
                        >
                            <span className="text-sm">📋 Copy Last Month</span>
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <section className="enterprise-card p-5 sm:p-6 lg:p-8 bg-[var(--bg-secondary)] mb-8 sm:mb-10">
                        <h3 className="text-base sm:text-lg font-heading font-bold text-[var(--text-primary)] mb-4 sm:mb-6">Add New Budget Item</h3>
                        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Item Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Rent, Groceries"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    className="enterprise-input"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Monthly Amount</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={newItem.amount}
                                    onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                                    className="enterprise-input"
                                    required
                                />
                            </div>
                            <div className="flex items-end md:col-span-2 lg:col-span-1 pt-2 sm:pt-0">
                                <button type="submit" className="enterprise-button-primary w-full py-3 sm:py-2.5">
                                    Add Budget Item
                                </button>
                            </div>
                        </form>
                    </section>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        {budget.budgetItems && budget.budgetItems.map(item => (
                            <div key={item.id} className="enterprise-card p-5 group hover:border-habi-gold/50 transition-colors">
                                <div className="flex justify-between items-start mb-4 sm:mb-6">
                                    <div className="flex-1 mr-4">
                                        {editingId === item.id ? (
                                            <input
                                                autoFocus
                                                className="enterprise-input text-lg sm:text-xl font-bold py-1 mb-1"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            />
                                        ) : (
                                            <h3 className="font-heading font-bold text-lg sm:text-xl text-[var(--text-primary)] truncate">{item.name}</h3>
                                        )}
                                        <span className="text-[var(--text-secondary)] text-[10px] font-medium uppercase tracking-widest mt-0.5 block">Expense Limit</span>
                                    </div>
                                    <div className="flex space-x-0.5 sm:space-x-1">
                                        {editingId === item.id ? (
                                            <>
                                                <button onClick={() => handleUpdateItem(item.id)} className="p-2 text-habi-success hover:bg-habi-success/10 rounded-sm transition-colors">
                                                    <Check size={18} />
                                                </button>
                                                <button onClick={cancelEditing} className="p-2 text-habi-error hover:bg-habi-error/10 rounded-sm transition-colors">
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEditing(item)} className="p-2 text-[var(--text-secondary)] hover:text-habi-primary hover:bg-habi-primary/10 rounded-sm transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => deleteItem(item.id)} className="p-2 text-[var(--text-secondary)] hover:text-habi-error hover:bg-habi-error/10 rounded-sm transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                                                    <Receipt size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 sm:space-y-4">
                                    <div className="flex justify-between items-baseline mb-1.5 sm:mb-2">
                                        <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">${item.spent || 0}</span>
                                        <div className="flex items-center space-x-1 sm:space-x-2">
                                            <span className="text-[var(--text-secondary)] text-[10px] sm:text-sm font-bold">Limit:</span>
                                            {editingId === item.id ? (
                                                <input
                                                    type="number"
                                                    className="enterprise-input w-20 sm:w-24 py-1 text-xs sm:text-sm font-black"
                                                    value={editForm.amount}
                                                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                                />
                                            ) : (
                                                <span className="text-[var(--text-primary)] text-xs sm:text-sm font-black">${item.amount}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full bg-[var(--bg-primary)] rounded-sm h-2.5 sm:h-3 overflow-hidden shadow-inner border border-[var(--border-color)]">
                                        <div
                                            className={`h-full rounded-sm transition-all duration-500 ${(item.spent || 0) > item.amount ? 'bg-habi-error' : 'bg-habi-primary'
                                                }`}
                                            style={{ width: `${Math.min(((item.spent || 0) / item.amount) * 100, 100)}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex justify-between items-center pt-1.5 sm:pt-2">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${(item.spent || 0) > item.amount ? 'bg-habi-error/10 text-habi-error' : 'bg-habi-success/10 text-habi-success'
                                            }`}>
                                            {(item.spent || 0) > item.amount ? 'Over Limit' : 'On Track'}
                                        </span>
                                        <span className="text-[var(--text-secondary)] text-[10px] font-bold italic">
                                            ${Math.max(0, item.amount - (item.spent || 0)).toLocaleString()} left
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {(!budget.budgetItems || budget.budgetItems.length === 0) && (
                        <div className="enterprise-card p-12 text-center border-dashed">
                            <p className="text-[var(--text-secondary)] italic">Your budget is empty. Start by adding items above.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Budgets;
