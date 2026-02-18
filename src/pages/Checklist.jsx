import { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    Share2,
    FolderOpen,
    PlusCircle,
    StickyNote,
    GripVertical
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    rectSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ─── Sortable Card ────────────────────────────────────────────────────────────
function SortableCard({ group, groupItems, inlineItemNames, setInlineItemNames, handleAddItem, handleToggleComplete, handleStartEdit, handleDelete, handleShareGroup, handleDeleteGroup, editingId, editingName, setEditingName, editingNameRef, handleSaveEdit, setEditingId }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="enterprise-card flex flex-col bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-habi-gold/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-habi-gold/5 h-fit select-none">
            {/* Card Header */}
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-habi-primary/5">
                <h3 className="font-bold text-sm tracking-widest uppercase text-habi-primary flex items-center gap-2 truncate">
                    <FolderOpen size={14} className="shrink-0" />
                    {group}
                </h3>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-habi-primary/10 text-habi-primary rounded-full">
                        {groupItems.length}
                    </span>
                    {/* Per-card Share */}
                    <button
                        onClick={() => handleShareGroup(group, groupItems)}
                        className="p-1.5 text-[var(--text-light)] hover:text-habi-primary hover:bg-habi-primary/10 rounded-md transition-colors"
                        title={`share "${group}" list`}
                    >
                        <Share2 size={14} />
                    </button>
                    {/* Delete Card — owner only */}
                    <button
                        onClick={() => handleDeleteGroup(group, groupItems)}
                        className="p-1.5 text-[var(--text-light)] hover:text-habi-error hover:bg-habi-error/10 rounded-md transition-colors"
                        title={`delete "${group}" list`}
                    >
                        <Trash2 size={14} />
                    </button>
                    {/* Drag Handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-1.5 text-[var(--text-light)] hover:text-habi-primary cursor-grab active:cursor-grabbing rounded-md transition-colors touch-none"
                        title="drag to reorder"
                    >
                        <GripVertical size={14} />
                    </button>
                </div>
            </div>

            {/* Items */}
            <div className="flex-1 p-2 min-h-[50px]">
                <div className="space-y-1">
                    {groupItems.map(item => (
                        <div key={item.id} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-colors group ${item.completed ? 'opacity-40' : ''}`}>
                            <button
                                onClick={() => handleToggleComplete(item)}
                                className={`shrink-0 transition-colors ${item.completed ? 'text-habi-success' : 'text-[var(--text-light)] hover:text-habi-primary'}`}
                            >
                                {item.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            </button>

                            <div className="flex-1 min-w-0">
                                {editingId === item.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={e => { setEditingName(e.target.value); editingNameRef.current = e.target.value; }}
                                        className="enterprise-input py-0.5 px-2 text-sm w-full bg-[var(--bg-primary)] text-[var(--text-primary)]"
                                        autoFocus
                                        onBlur={() => handleSaveEdit(item.id)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleSaveEdit(item.id);
                                            if (e.key === 'Escape') { setEditingId(null); editingNameRef.current = ''; }
                                        }}
                                    />
                                ) : (
                                    <span
                                        onMouseDown={e => { e.preventDefault(); handleStartEdit(item); }}
                                        className={`text-sm font-medium text-[var(--text-primary)] cursor-text truncate block ${item.completed ? 'line-through' : ''} lowercase`}
                                    >
                                        {item.name}
                                    </span>
                                )}
                            </div>

                            {!item.completed && (
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-light)] hover:text-habi-error hover:bg-habi-error/10 rounded-md transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Inline Add */}
            <div className="p-4 bg-[var(--bg-primary)]/50 border-t border-[var(--border-color)]">
                <div className="relative group/input">
                    <PlusCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-light)] group-focus-within/input:text-habi-primary transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="add item..."
                        value={inlineItemNames[group] || ''}
                        onChange={e => setInlineItemNames(prev => ({ ...prev, [group]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddItem(group, inlineItemNames[group])}
                        className="w-full bg-transparent pl-10 pr-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none lowercase placeholder:text-[var(--text-light)]"
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Main Checklist ───────────────────────────────────────────────────────────
function Checklist({ selectedMonth }) {
    const [items, setItems] = useState([]);
    const [groupOrder, setGroupOrder] = useState([]);
    const [newListName, setNewListName] = useState('');
    const [inlineItemNames, setInlineItemNames] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const editingNameRef = useRef('');
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState(null);
    const { user } = useAuth();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    // ── Real-time subscription ──────────────────────────────────────────────
    useEffect(() => {
        if (!selectedMonth || !user) return;

        setLoading(true);
        const month = selectedMonth.getMonth() + 1;
        const year = selectedMonth.getFullYear();

        const unsubscribe = api.subscribeToChecklistItems(user.uid, { month, year }, (newItems) => {
            setItems(newItems);
            setLoading(false);
            // Preserve existing group order, append any new groups
            const groups = [...new Set(newItems.map(i => i.group || 'general'))];
            setGroupOrder(prev => {
                const existing = prev.filter(g => groups.includes(g));
                const added = groups.filter(g => !prev.includes(g));
                return [...existing, ...added];
            });
        });

        return () => unsubscribe(); // cleanup on month/user change
    }, [selectedMonth, user]);

    const handleCreateList = (e) => {
        e.preventDefault();
        if (!newListName.trim()) return;
        const groupName = newListName.trim().toLowerCase();
        setNewListName('');
        setInlineItemNames(prev => ({ ...prev, [groupName]: '' }));
        setGroupOrder(prev => prev.includes(groupName) ? prev : [...prev, groupName]);
    };

    const handleAddItem = async (group, itemName) => {
        if (!itemName.trim()) return;
        try {
            await api.post('/checklist-items', {
                name: itemName.trim(),
                group,
                month: selectedMonth.getMonth() + 1,
                year: selectedMonth.getFullYear()
            }, { userId: user.uid });
            setInlineItemNames(prev => ({ ...prev, [group]: '' }));
            // No need to fetchItems — onSnapshot will update automatically
        } catch (error) { console.error(error); }
    };

    const handleToggleComplete = async (item) => {
        try {
            await api.put(`/checklist-items/${item.id}`, { completed: !item.completed }, { userId: user.uid });
        } catch (error) { console.error(error); }
    };

    const handleStartEdit = (item) => {
        setEditingId(item.id);
        setEditingName(item.name);
        editingNameRef.current = item.name;
    };

    const handleSaveEdit = async (id) => {
        const nameToSave = editingNameRef.current.trim();
        if (!nameToSave) return;
        setEditingId(null);
        try {
            await api.put(`/checklist-items/${id}`, { name: nameToSave }, { userId: user.uid });
        } catch (error) { console.error(error); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("delete this item?")) return;
        try {
            await api.delete(`/checklist-items/${id}`, { userId: user.uid });
        } catch (error) { console.error(error); }
    };

    // Share a URL — native share sheet on iOS, clipboard on desktop, prompt as last resort
    const shareUrl = async (url, title) => {
        if (navigator.share) {
            try { await navigator.share({ title, url }); return; }
            catch (e) { if (e.name === 'AbortError') return; } // user dismissed
        }
        try { await navigator.clipboard.writeText(url); alert('link copied to clipboard!'); return; }
        catch (_) { }
        window.prompt('copy this link:', url); // last resort
    };

    // Share entire list (all groups)
    const handleShareAll = async () => {
        if (items.length === 0) return;
        try {
            const month = selectedMonth.getMonth() + 1;
            const year = selectedMonth.getFullYear();
            const res = await api.post('/checklist-shares', { group: null, month, year }, { userId: user.uid });
            const url = `${window.location.origin}/checklist/import/${res.data.id}`;
            await shareUrl(url, 'my checklist');
        } catch (error) { console.error(error); alert('failed to generate share link.'); }
    };

    // Share a single group
    const handleShareGroup = async (group, groupItems) => {
        if (groupItems.length === 0) { alert('this list is empty.'); return; }
        try {
            const month = selectedMonth.getMonth() + 1;
            const year = selectedMonth.getFullYear();
            const res = await api.post('/checklist-shares', { group, month, year }, { userId: user.uid });
            const url = `${window.location.origin}/checklist/import/${res.data.id}`;
            await shareUrl(url, `"${group}" list`);
        } catch (error) { console.error(error); alert('failed to generate share link.'); }
    };

    // Delete all items in a group (owner only — always true on this page)
    const handleDeleteGroup = async (group, groupItems) => {
        if (!window.confirm(`delete the entire "${group}" list and all its items?`)) return;
        try {
            await Promise.all(groupItems.map(item => api.delete(`/checklist-items/${item.id}`, { userId: user.uid })));
            setGroupOrder(prev => prev.filter(g => g !== group));
            setInlineItemNames(prev => { const next = { ...prev }; delete next[group]; return next; });
        } catch (error) { console.error(error); }
    };

    // Build grouped map
    const groupedItems = items.reduce((acc, item) => {
        const group = item.group || 'general';
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {});

    // Merge inline-only groups (newly created, no items yet)
    Object.keys(inlineItemNames).forEach(group => {
        if (!groupedItems[group]) groupedItems[group] = [];
    });

    // Final ordered list
    const orderedGroups = [
        ...groupOrder.filter(g => groupedItems[g] !== undefined),
        ...Object.keys(groupedItems).filter(g => !groupOrder.includes(g))
    ];

    const handleDragStart = ({ active }) => setActiveId(active.id);
    const handleDragEnd = ({ active, over }) => {
        setActiveId(null);
        if (!over || active.id === over.id) return;
        setGroupOrder(prev => arrayMove(prev, prev.indexOf(active.id), prev.indexOf(over.id)));
    };

    const cardProps = { inlineItemNames, setInlineItemNames, handleAddItem, handleToggleComplete, handleStartEdit, handleDelete, handleShareGroup, handleDeleteGroup, editingId, editingName, setEditingName, editingNameRef, handleSaveEdit, setEditingId };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)] tracking-tighter lowercase">
                        monthly checklist
                    </h2>
                    <p className="text-sm lg:text-base text-[var(--text-secondary)] mt-1 font-medium lowercase flex items-center gap-2">
                        organize your lists like sticky notes.
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-habi-success/10 text-habi-success rounded-full">
                            <span className="w-1.5 h-1.5 bg-habi-success rounded-full animate-pulse" />
                            live
                        </span>
                    </p>
                </div>
                <div className="flex gap-2" />
            </header>

            {/* Create New List */}
            <section className="flex justify-center">
                <div className="w-full max-w-xl enterprise-card p-4 bg-[var(--bg-secondary)] border-2 border-habi-primary/20">
                    <form onSubmit={handleCreateList} className="flex gap-3">
                        <div className="flex-1 relative">
                            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-habi-primary" size={18} />
                            <input
                                type="text"
                                placeholder="create a new list (e.g. groceries)..."
                                value={newListName}
                                onChange={e => setNewListName(e.target.value)}
                                className="enterprise-input pl-10 w-full"
                            />
                        </div>
                        <button type="submit" className="enterprise-button-primary px-6 lowercase">create</button>
                    </form>
                </div>
            </section>

            {/* Cards Grid */}
            <section>
                {loading ? (
                    <div className="p-20 text-center text-[var(--text-secondary)] italic lowercase animate-pulse">loading your notes...</div>
                ) : orderedGroups.length === 0 ? (
                    <div className="enterprise-card p-16 text-center bg-[var(--bg-secondary)] border-dashed border-2 border-[var(--border-color)] max-w-2xl mx-auto mt-8">
                        <StickyNote className="mx-auto text-[var(--text-light)] mb-6" size={64} />
                        <p className="text-[var(--text-secondary)] font-bold text-xl lowercase">no lists yet.</p>
                        <p className="text-[var(--text-secondary)] opacity-60 text-sm mt-2 lowercase">type a name above to start a new sticky note list.</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={orderedGroups} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-start">
                                {orderedGroups.map(group => (
                                    <SortableCard
                                        key={group}
                                        group={group}
                                        groupItems={groupedItems[group] || []}
                                        {...cardProps}
                                    />
                                ))}
                            </div>
                        </SortableContext>

                        {/* Drag Overlay */}
                        <DragOverlay>
                            {activeId ? (
                                <div className="enterprise-card bg-[var(--bg-secondary)] border-2 border-habi-primary/60 shadow-2xl shadow-habi-primary/20 opacity-95 rotate-1 scale-105">
                                    <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-habi-primary/10">
                                        <h3 className="font-bold text-sm tracking-widest uppercase text-habi-primary flex items-center gap-2">
                                            <FolderOpen size={14} />
                                            {activeId}
                                        </h3>
                                        <GripVertical size={14} className="text-habi-primary" />
                                    </div>
                                    <div className="p-4 text-xs text-[var(--text-secondary)] lowercase italic">
                                        {(groupedItems[activeId] || []).length} items
                                    </div>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}
            </section>
        </div>
    );
}

export default Checklist;
