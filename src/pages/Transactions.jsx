import { useState, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, Plus, X, Receipt, Wallet, Tags, Trash2, Edit2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Transactions({ selectedMonth }) {
    const [transactions, setTransactions] = useState([]);
    const [budgetItems, setBudgetItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        date: '',
        budgetItem: { id: '' },
        category: { id: 'system-uncategorized' }
    });
    const { user } = useAuth();

    // Filter and Sort State
    const [filterText, setFilterText] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterBudgetItem, setFilterBudgetItem] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (selectedMonth && user) {
            const loadAllData = async () => {
                setLoading(true);
                await Promise.all([
                    fetchTransactions(),
                    fetchBudgetItems(),
                    fetchCategories()
                ]);
                updateDefaultDate();
                setLoading(false);
            };
            loadAllData();
        }
    }, [selectedMonth, user]);

    const updateDefaultDate = () => {
        const today = new Date();
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();

        let newDate = new Date(year, month, 1);
        if (today.getFullYear() === year && today.getMonth() === month) {
            newDate = today;
        }

        // Adjust for timezone to get YYYY-MM-DD
        const offset = newDate.getTimezoneOffset();
        const dateStr = new Date(newDate.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];

        setFormData(prev => ({ ...prev, date: dateStr }));
    }

    const fetchTransactions = async () => {
        try {
            const month = selectedMonth.getMonth() + 1;
            const year = selectedMonth.getFullYear();
            const res = await api.get('/transactions', { userId: user.uid, params: { month, year } });
            setTransactions(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchBudgetItems = async () => {
        try {
            const month = selectedMonth.getMonth() + 1;
            const year = selectedMonth.getFullYear();
            const res = await api.get('/budgets', { userId: user.uid, params: { month, year } });
            if (res.data && res.data.budgetItems) {
                setBudgetItems(res.data.budgetItems);
            } else {
                setBudgetItems([]);
            }
        } catch (error) {
            console.error("Error fetching budget items:", error);
            setBudgetItems([]);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories', { userId: user.uid });
            setCategories(res.data);
        } catch (error) { console.error(error); }
    }

    const handleEdit = (t) => {
        setEditingId(t.id);
        setFormData({
            description: t.description,
            amount: t.amount,
            date: t.date,
            budgetItem: { id: t.budgetItem?.id || '' },
            category: { id: t.category?.id || '' }
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this transaction?")) return;
        try {
            await api.delete(`/transactions/${id}`, { userId: user.uid });
            fetchTransactions();
        } catch (error) { console.error("Error deleting transaction:", error); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Resolve names for denormalization
            const selectedBudgetItem = budgetItems.find(b => b.id === formData.budgetItem.id);
            const selectedCategory = categories.find(c => c.id === formData.category.id);

            const payload = {
                ...formData,
                budgetItemName: selectedBudgetItem?.name || '',
                categoryName: selectedCategory?.name || (formData.category.id === 'system-uncategorized' ? 'Uncategorized' : '')
            };

            if (editingId) {
                await api.put(`/transactions/${editingId}`, payload, { userId: user.uid });
            } else {
                await api.post('/transactions', payload, { userId: user.uid });
            }
            fetchTransactions();
            setFormData(prev => ({ ...prev, description: '', amount: '', category: { id: 'system-uncategorized' } }));
            setEditingId(null);
        } catch (error) { console.error(error); }
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedTransactions = [...transactions].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested objects or denormalized names
        if (sortConfig.key === 'category') aValue = a.categoryName || a.category?.name || '';
        if (sortConfig.key === 'budgetItem') aValue = a.budgetItemName || a.budgetItem?.name || '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredTransactions = sortedTransactions.filter(t => {
        const matchesText = t.description.toLowerCase().includes(filterText.toLowerCase());
        const matchesCategory = !filterCategory || t.category?.id?.toString() === filterCategory;
        const matchesBudgetItem = !filterBudgetItem || t.budgetItem?.id?.toString() === filterBudgetItem;
        return matchesText && matchesCategory && matchesBudgetItem;
    });

    if (loading && transactions.length === 0) return <div className="p-10 text-center text-[var(--text-secondary)] italic">Loading transactions...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-heading font-extrabold text-[var(--text-primary)] tracking-tight">
                        Transactions
                    </h2>
                    <p className="text-sm lg:text-base text-[var(--text-secondary)] mt-1 font-medium">Detailed history of all your recorded financial activities.</p>
                </div>
            </header>

            <section className="enterprise-card p-6 lg:p-8 bg-[var(--bg-secondary)] border-l-4 border-l-habi-primary">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-heading font-bold text-[var(--text-primary)]">
                        {editingId ? "Update Transaction" : "Record Transaction"}
                    </h3>
                    {editingId && (
                        <button
                            onClick={() => { setEditingId(null); setFormData(prev => ({ ...prev, description: '', amount: '' })); }}
                            className="text-xs font-bold text-habi-error hover:brightness-110 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                        >
                            <X size={14} /> Cancel Edit
                        </button>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Description</label>
                        <input
                            type="text" placeholder="What did you buy?"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="enterprise-input" required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Amount</label>
                        <input
                            type="number" placeholder="0.00"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            className="enterprise-input" required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            className="enterprise-input" required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Budget Item</label>
                        <select
                            value={formData.budgetItem.id}
                            onChange={e => setFormData({ ...formData, budgetItem: { id: e.target.value } })}
                            className="enterprise-input appearance-none"
                        >
                            <option value="">Unassigned</option>
                            {budgetItems.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Category</label>
                        <select
                            value={formData.category.id}
                            onChange={e => setFormData({ ...formData, category: { id: e.target.value } })}
                            className="enterprise-input appearance-none"
                        >
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" className={`enterprise-button-primary w-full ${editingId ? 'bg-habi-gold hover:brightness-110' : ''}`}>
                        {editingId ? "Update" : "Save"}
                    </button>
                </form>
            </section>

            <section className="enterprise-card bg-[var(--bg-secondary)] overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-[var(--border-color)] bg-[var(--bg-card-header)] flex flex-wrap gap-4 sm:gap-6 items-center">
                    <div className="relative flex-1 min-w-full sm:min-w-[300px]">
                        <input
                            type="text"
                            placeholder="Filter by description..."
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm px-10 sm:px-12 py-2 sm:py-2.5 text-base focus:ring-2 focus:ring-[var(--accent-color)] outline-none"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                            <Search size={16} />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="flex-1 sm:flex-none bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm px-3 sm:px-4 py-2 text-xs sm:text-sm text-[var(--text-primary)] outline-none"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select
                            value={filterBudgetItem}
                            onChange={e => setFilterBudgetItem(e.target.value)}
                            className="flex-1 sm:flex-none bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm px-3 sm:px-4 py-2 text-xs sm:text-sm text-[var(--text-primary)] outline-none"
                        >
                            <option value="">All Items</option>
                            {budgetItems.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={() => { setFilterText(''); setFilterCategory(''); setFilterBudgetItem(''); }}
                        className="w-full sm:w-auto text-[10px] sm:text-xs font-bold text-[var(--accent-gold)] hover:brightness-110 uppercase tracking-widest transition-colors py-1 sm:py-0"
                    >
                        Clear Filters
                    </button>
                </div>

                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                                <th className="p-6 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-habi-primary transition-colors" onClick={() => requestSort('date')}>
                                    Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-6 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-habi-primary transition-colors" onClick={() => requestSort('description')}>
                                    Description {sortConfig.key === 'description' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-6 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-habi-primary transition-colors" onClick={() => requestSort('budgetItem')}>
                                    Budget Item {sortConfig.key === 'budgetItem' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-6 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-habi-primary transition-colors" onClick={() => requestSort('category')}>
                                    Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-6 text-right text-xs font-bold uppercase tracking-wider">Amount</th>
                                <th className="p-6 text-right text-xs font-bold uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {filteredTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-[var(--bg-primary)] transition-colors group">
                                    <td className="p-6 text-sm text-[var(--text-secondary)] font-medium">{t.date}</td>
                                    <td className="p-6 text-sm font-bold text-[var(--text-primary)]">{t.description}</td>
                                    <td className="p-6">
                                        <span className="px-3 py-1 bg-[var(--text-light)]/10 text-[var(--text-secondary)] rounded-sm text-xs font-black uppercase tracking-tighter">
                                            {t.budgetItemName || t.budgetItem?.name || '-'}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className="px-3 py-1 bg-habi-primary/10 text-habi-primary rounded-sm text-xs font-black uppercase tracking-tighter">
                                            {t.categoryName || t.category?.name || '-'}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <span className="text-sm font-black text-habi-error">-${t.amount?.toFixed(2)}</span>
                                    </td>
                                    <td className="p-6 text-right space-x-2">
                                        <button
                                            onClick={() => handleEdit(t)}
                                            className="p-2 text-[var(--text-secondary)] hover:text-habi-primary hover:bg-habi-primary/10 rounded-sm transition-colors"
                                            title="Edit Transaction"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(t.id)}
                                            className="p-2 text-[var(--text-secondary)] hover:text-habi-error hover:bg-habi-error/10 rounded-sm transition-colors"
                                            title="Delete Transaction"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile/Tablet Card View */}
                <div className="lg:hidden divide-y divide-[var(--border-color)]">
                    {filteredTransactions.map(t => (
                        <div key={t.id} className="p-4 sm:p-5 flex justify-between items-center bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-colors">
                            <div className="flex flex-col space-y-1.5 flex-1 pr-4">
                                <div className="flex items-center space-x-2">
                                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t.date}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-black uppercase border ${t.budgetItem || t.budgetItemName ? "border-[var(--text-light)]/20 text-[var(--text-secondary)] bg-[var(--bg-primary)]" : "border-habi-primary/20 text-habi-primary bg-habi-primary/5"}`}>
                                        {t.budgetItemName || t.budgetItem?.name || t.categoryName || t.category?.name || 'General'}
                                    </span>
                                </div>
                                <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] leading-tight">{t.description}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <span className="text-base font-black text-habi-error">-${t.amount?.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={() => handleEdit(t)}
                                    className="p-2 text-[var(--text-secondary)] hover:text-habi-primary bg-[var(--bg-primary)] rounded-sm transition-colors border border-[var(--border-color)]"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    className="p-2 text-[var(--text-secondary)] hover:text-habi-error bg-[var(--bg-primary)] rounded-sm transition-colors border border-[var(--border-color)]"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredTransactions.length === 0 && (
                    <div className="p-20 text-center text-[var(--text-secondary)] italic">
                        No transactions found matching your filters.
                    </div>
                )}
            </section>
        </div>
    );
}

export default Transactions;
