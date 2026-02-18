import { useState, useEffect } from 'react';
import { Wallet, Receipt, Tags } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Categories() {
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user) fetchCategories();
    }, [user]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('/categories', { userId: user.uid });
            setCategories(res.data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.post('/categories', { id: editingId, name }, { userId: user.uid });
            } else {
                await api.post('/categories', { name }, { userId: user.uid });
            }
            setName('');
            setEditingId(null);
            fetchCategories();
        } catch (error) {
            console.error("Error saving category:", error);
        }
    };

    const handleEdit = (category) => {
        setName(category.name);
        setEditingId(category.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;
        try {
            await api.delete(`/categories/${id}`, { userId: user.uid });
            fetchCategories();
        } catch (error) {
            alert("Could not delete category. It might be in use by transactions.");
            console.error("Error deleting category:", error);
        }
    };

    if (loading && categories.length === 0) return <div className="p-6">Loading categories...</div>;

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Categories</h2>
                    <p className="text-sm lg:text-base text-[var(--text-secondary)] mt-1 font-medium">Organize your spending by color and pattern - classify your financial threads.</p>
                </div>
            </header>

            <section className="enterprise-card p-6 lg:p-8 bg-[var(--bg-secondary)]">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">
                    {editingId ? "Modify Classification" : "New Category"}
                </h3>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="e.g. Health, Entertainment"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="enterprise-input pr-10 text-sm sm:text-base py-3 sm:py-2.5"
                            required
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                            <Tags size={16} />
                        </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                        <button
                            type="submit"
                            className="enterprise-button-primary flex-1 sm:flex-none px-6 sm:px-8 whitespace-nowrap text-sm"
                        >
                            {editingId ? "Update" : "Add Category"}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => { setEditingId(null); setName(''); }}
                                className="enterprise-button-secondary flex-1 sm:flex-none px-4 sm:px-6 text-sm"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section className="enterprise-card bg-[var(--bg-secondary)]">
                <div className="bg-[var(--bg-primary)] p-6 border-b border-[var(--border-color)]">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Product Classifications</h3>
                </div>
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                                <th className="p-6 text-xs font-bold uppercase tracking-wider">Category Name</th>
                                <th className="p-6 text-right text-xs font-bold uppercase tracking-wider">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-[var(--bg-primary)] transition-colors group">
                                    <td className="p-6 text-sm font-bold text-[var(--text-primary)]">
                                        {cat.name}
                                        {cat.isSystem && <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">System</span>}
                                    </td>
                                    <td className="p-6 text-right space-x-6">
                                        {!cat.isSystem && (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(cat)}
                                                    className="text-blue-500 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="text-[var(--text-secondary)] hover:text-rose-500 font-black text-xs uppercase tracking-widest transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="sm:hidden divide-y divide-[var(--border-color)]">
                    {categories.map((cat) => (
                        <div key={cat.id} className="p-4 flex justify-between items-center hover:bg-[var(--bg-primary)] transition-colors">
                            <span className="text-sm font-bold text-[var(--text-primary)]">
                                {cat.name}
                                {cat.isSystem && <span className="ml-2 text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-black uppercase tracking-tighter">System</span>}
                            </span>
                            {!cat.isSystem && (
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => handleEdit(cat)}
                                        className="text-blue-500 font-black text-[10px] uppercase tracking-wider"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="text-[var(--text-secondary)] font-black text-[10px] uppercase tracking-wider"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {categories.length === 0 && (
                    <div className="p-12 text-center text-[var(--text-secondary)] italic text-sm">
                        No categories defined yet.
                    </div>
                )}
            </section>
        </div>
    );
}

export default Categories;
