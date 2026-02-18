import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Download,
    CheckCircle2,
    Circle,
    FolderOpen,
    ArrowLeft,
    Wifi
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function ChecklistImport() {
    const { shareId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [shareData, setShareData] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isOwner = shareData && user && shareData.createdBy === user.uid;

    // Step 1: Fetch the share metadata
    useEffect(() => {
        api.getChecklistShare(shareId)
            .then(data => setShareData(data))
            .catch(() => { setError("could not find this shared list."); setLoading(false); });
    }, [shareId]);

    // Step 2: Once we have share metadata, subscribe to the live items
    useEffect(() => {
        if (!shareData) return;
        setLoading(true);
        const unsubscribe = api.subscribeToSharedItems(shareData, (liveItems) => {
            setItems(liveItems);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [shareData]);

    // Toggle complete — allowed for all viewers
    const handleToggle = async (item) => {
        try {
            await api.put(`/checklist-items/${item.id}`, { completed: !item.completed }, { userId: shareData.createdBy });
        } catch (err) { console.error(err); }
    };

    // Delete — owner only
    const handleDelete = async (id) => {
        if (!isOwner) return;
        if (!window.confirm("delete this item?")) return;
        try {
            await api.delete(`/checklist-items/${id}`, { userId: shareData.createdBy });
        } catch (err) { console.error(err); }
    };

    // Group items
    const groupedItems = items.reduce((acc, item) => {
        const group = item.group || 'general';
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {});

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
            <div className="enterprise-card p-10 max-w-md text-center bg-[var(--bg-secondary)]">
                <p className="text-habi-error font-bold text-lg lowercase mb-6">{error}</p>
                <button onClick={() => navigate('/checklist')} className="enterprise-button-secondary w-full lowercase">
                    go back
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-4 lg:p-12">
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

                {/* Header */}
                <header className="space-y-2">
                    <button onClick={() => navigate('/checklist')} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors lowercase mb-4">
                        <ArrowLeft size={16} /> back to my checklist
                    </button>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-heading font-extrabold text-[var(--text-primary)] tracking-tighter lowercase flex items-center gap-3">
                                <Download size={28} className="text-habi-primary shrink-0" />
                                shared checklist
                            </h1>
                            <p className="text-[var(--text-secondary)] text-sm mt-1 lowercase">
                                {isOwner
                                    ? "you're viewing your own shared list. you can manage items here."
                                    : "you can tick and untick items. only the owner can delete."}
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 bg-habi-success/10 text-habi-success rounded-sm shrink-0 mt-1">
                            <span className="w-1.5 h-1.5 bg-habi-success rounded-full animate-pulse" />
                            live
                        </span>
                    </div>

                    {/* Permission badge */}
                    <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-sm mt-2 ${isOwner ? 'bg-habi-primary/10 text-habi-primary' : 'bg-habi-warning/10 text-habi-warning'}`}>
                        {isOwner ? '✦ owner — full access' : '👁 viewer — tick/untick only'}
                    </div>
                </header>

                {/* Items */}
                {loading ? (
                    <div className="p-20 text-center text-[var(--text-secondary)] italic lowercase animate-pulse">loading live items...</div>
                ) : items.length === 0 ? (
                    <div className="enterprise-card p-12 text-center bg-[var(--bg-secondary)] border-dashed border-2 border-[var(--border-color)]">
                        <p className="text-[var(--text-secondary)] lowercase">this list is empty.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedItems).map(([group, groupItems]) => (
                            <div key={group} className="enterprise-card bg-[var(--bg-secondary)] overflow-hidden">
                                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card-header)] flex items-center gap-2">
                                    <FolderOpen size={14} className="text-habi-primary" />
                                    <h3 className="font-bold text-sm tracking-widest uppercase text-habi-primary">{group}</h3>
                                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-habi-primary/10 text-habi-primary rounded-sm">
                                        {groupItems.length} items
                                    </span>
                                </div>
                                <div className="divide-y divide-[var(--border-color)]">
                                    {groupItems.map(item => (
                                        <div key={item.id} className={`flex items-center gap-4 p-4 hover:bg-[var(--bg-primary)] transition-colors group ${item.completed ? 'opacity-50' : ''}`}>
                                            <button
                                                onClick={() => handleToggle(item)}
                                                className={`shrink-0 transition-colors ${item.completed ? 'text-habi-success' : 'text-[var(--text-light)] hover:text-habi-primary'}`}
                                            >
                                                {item.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                            </button>
                                            <span className={`flex-1 text-sm font-medium text-[var(--text-primary)] lowercase ${item.completed ? 'line-through' : ''}`}>
                                                {item.name}
                                            </span>
                                            {/* Delete — owner only */}
                                            {isOwner && (
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-light)] hover:text-habi-error hover:bg-habi-error/10 rounded-sm transition-all text-xs lowercase"
                                                >
                                                    delete
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChecklistImport;
