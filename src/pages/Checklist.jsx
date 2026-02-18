import { useState, useEffect } from 'react';
import { Plus, X, Trash2, Edit2, CheckCircle2, Circle, ClipboardList } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Checklist({ selectedMonth }) {
    const [items, setItems] = useState([]);
    const [newItemName, setNewItemName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (selectedMonth && user) {
            fetchItems();
        }
    }, [selectedMonth, user]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const month = selectedMonth.getMonth() + 1;
            const year = selectedMonth.getFullYear();
            const res = await api.get('/checklist-items', { userId: user.uid, params: { month, year } });
            setItems(res.data);
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItemName.trim()) return;
        try {
            const payload = {
                name: newItemName.trim(),
                month: selectedMonth.getMonth() + 1,
                year: selectedMonth.getFullYear()
            };
            await api.post('/checklist-items', payload, { userId: user.uid });
            setNewItemName('');
            fetchItems();
        } catch (error) { console.error(error); }
    };

    const handleToggleComplete = async (item) => {
        try {
            await api.put(`/checklist-items/${item.id}`, { completed: !item.completed }, { userId: user.uid });
            fetchItems();
        } catch (error) { console.error(error); }
    };

    const handleStartEdit = (item) => {
        setEditingId(item.id);
        setEditingName(item.name);
    };

    const handleSaveEdit = async (id) => {
        if (!editingName.trim()) return;
        try {
            await api.put(`/checklist-items/${id}`, { name: editingName.trim() }, { userId: user.uid });
            setEditingId(null);
            fetchItems();
        } catch (error) { console.error(error); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this item?")) return;
        try {
            await api.delete(`/checklist-items/${id}`, { userId: user.uid });
            fetchItems();
        } catch (error) { console.error(error); }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    Monthly Checklist
                </h2>
                <p className="text-sm lg:text-base text-[var(--text-secondary)] mt-1 font-medium">Mark off the knots in your family's monthly to-do tapestry.</p>
            </header>

            <section className="enterprise-card p-6 lg:p-8 bg-[var(--bg-secondary)] border-l-4 border-l-indigo-500">
                <form onSubmit={handleAddItem} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Add a new item..."
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        className="enterprise-input flex-1"
                    />
                    <button type="submit" className="enterprise-button-primary px-8">
                        Add
                    </button>
                </form>
            </section>

            <section className="space-y-4">
                {loading && items.length === 0 ? (
                    <div className="p-10 text-center text-[var(--text-secondary)] italic">Loading list...</div>
                ) : items.length === 0 ? (
                    <div className="enterprise-card p-12 text-center bg-[var(--bg-secondary)] border-dashed border-2 border-[var(--border-color)]">
                        <ClipboardList className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-[var(--text-secondary)] font-medium text-lg">Your list is empty for this month.</p>
                        <p className="text-[var(--text-secondary)] opacity-60 text-sm mt-1">Add items above to get started.</p>
                    </div>
                ) : (
                    <div className="enterprise-card overflow-hidden bg-[var(--bg-secondary)]">
                        <div className="divide-y divide-[var(--border-color)]">
                            {items.map(item => (
                                <div key={item.id} className={`p-4 sm:p-5 flex items-center gap-4 hover:bg-[var(--bg-primary)] transition-colors group ${item.completed ? 'opacity-60' : ''}`}>
                                    <button
                                        onClick={() => handleToggleComplete(item)}
                                        className={`transition-colors ${item.completed ? 'text-green-500' : 'text-slate-300 hover:text-indigo-500'}`}
                                    >
                                        {item.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                    </button>

                                    <div className="flex-1">
                                        {editingId === item.id ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={e => setEditingName(e.target.value)}
                                                    className="enterprise-input py-1 text-sm flex-1"
                                                    autoFocus
                                                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit(item.id)}
                                                />
                                                <button onClick={() => handleSaveEdit(item.id)} className="text-xs font-bold text-blue-500 uppercase tracking-widest">Save</button>
                                                <button onClick={() => setEditingId(null)} className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cancel</button>
                                            </div>
                                        ) : (
                                            <span className={`text-sm lg:text-base font-semibold text-[var(--text-primary)] ${item.completed ? 'line-through' : ''}`}>
                                                {item.name}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleStartEdit(item)}
                                            className="p-2 text-[var(--text-secondary)] hover:text-blue-500 hover:bg-blue-500/10 rounded-lg"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Checklist;
