import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    orderBy,
    limit,
    Timestamp,
    setDoc,
    increment,
    onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_TRANSACTIONS = "transactions";
const COLLECTION_BUDGETS = "budgets";
const COLLECTION_CATEGORIES = "categories";
const COLLECTION_BUDGET_ITEMS = "budgetItems";
const COLLECTION_CHECKLIST_ITEMS = "checklistItems";
const COLLECTION_CHECKLIST_SHARES = "checklistShares";

const api = {
    // Transactions
    getTransactions: async (userId, params) => {
        const { month, year } = params || {};
        let q = query(collection(db, COLLECTION_TRANSACTIONS), where("userId", "==", userId));

        if (month && year) {
            q = query(q, where("month", "==", parseInt(month)), where("year", "==", parseInt(year)));
        }

        const snapshot = await getDocs(q);
        const transactions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // Sort in memory: Primary by date (desc), Secondary by createdAt (desc)
        return transactions.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) return dateB - dateA;
            return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        });
    },

    addTransaction: async (userId, data) => {
        const docData = {
            ...data,
            userId,
            amount: parseFloat(data.amount),
            month: new Date(data.date).getMonth() + 1,
            year: new Date(data.date).getFullYear(),
            createdAt: Timestamp.now()
        };

        // Add the transaction
        const docRef = await addDoc(collection(db, COLLECTION_TRANSACTIONS), docData);

        // Update the budget item "spent" amount if applicable
        if (data.budgetItem && data.budgetItem.id) {
            try {
                const itemRef = doc(db, COLLECTION_BUDGET_ITEMS, data.budgetItem.id);
                await updateDoc(itemRef, {
                    spent: increment(parseFloat(data.amount))
                });
            } catch (err) {
                console.error("Failed to update budget item spent amount:", err);
            }
        }

        return { id: docRef.id, ...docData };
    },

    updateTransaction: async (userId, id, data) => {
        const docRef = doc(db, COLLECTION_TRANSACTIONS, id);
        const snap = await getDoc(docRef);

        if (!snap.exists()) throw new Error("Transaction not found");
        const oldData = snap.data();

        if (oldData.userId !== userId) throw new Error("Unauthorized");

        const newAmount = parseFloat(data.amount);
        const oldAmount = parseFloat(oldData.amount);

        // 1. Handle Budget Item association changes
        const oldBudgetItemId = oldData.budgetItem?.id;
        const newBudgetItemId = data.budgetItem?.id;

        if (oldBudgetItemId !== newBudgetItemId) {
            // Case: Budget item changed or unassigned/reassigned
            if (oldBudgetItemId) {
                // Decrement old budget item
                try {
                    const oldItemRef = doc(db, COLLECTION_BUDGET_ITEMS, oldBudgetItemId);
                    await updateDoc(oldItemRef, { spent: increment(-oldAmount) });
                } catch (e) { console.error("Failed to decrement old budget item:", e); }
            }
            if (newBudgetItemId) {
                // Increment new budget item
                try {
                    const newItemRef = doc(db, COLLECTION_BUDGET_ITEMS, newBudgetItemId);
                    await updateDoc(newItemRef, { spent: increment(newAmount) });
                } catch (e) { console.error("Failed to increment new budget item:", e); }
            }
        } else if (newBudgetItemId && oldAmount !== newAmount) {
            // Case: Same budget item, but amount changed
            try {
                const itemRef = doc(db, COLLECTION_BUDGET_ITEMS, newBudgetItemId);
                await updateDoc(itemRef, { spent: increment(newAmount - oldAmount) });
            } catch (e) { console.error("Failed to update budget item amount:", e); }
        }

        // 2. Update the transaction document
        const updateData = {
            ...data,
            amount: newAmount,
            month: new Date(data.date).getMonth() + 1,
            year: new Date(data.date).getFullYear(),
            updatedAt: Timestamp.now()
        };
        await updateDoc(docRef, updateData);
        return { id, ...updateData };
    },

    deleteTransaction: async (userId, id) => {
        const docRef = doc(db, COLLECTION_TRANSACTIONS, id);
        const snap = await getDoc(docRef);

        if (!snap.exists()) return;
        const data = snap.data();

        if (data.userId !== userId) throw new Error("Unauthorized");

        // Decrement the budget item "spent" amount if applicable
        if (data.budgetItem && data.budgetItem.id) {
            try {
                const itemRef = doc(db, COLLECTION_BUDGET_ITEMS, data.budgetItem.id);
                // Atomic decrement using increment(-amount)
                await updateDoc(itemRef, {
                    spent: increment(-parseFloat(data.amount))
                });
            } catch (err) {
                console.error("Failed to update budget item spent amount on delete:", err);
            }
        }

        await deleteDoc(docRef);
    },

    // Budgets
    getBudgets: async (userId, params) => {
        const { month, year } = params || {};
        let q = query(collection(db, COLLECTION_BUDGETS), where("userId", "==", userId));

        if (month && year) {
            q = query(q, where("month", "==", parseInt(month)), where("year", "==", parseInt(year)));
        }

        const snapshot = await getDocs(q);
        const budgets = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        for (let budget of budgets) {
            const itemsQ = query(collection(db, COLLECTION_BUDGET_ITEMS),
                where("budgetId", "==", budget.id),
                where("userId", "==", userId)
            );
            const itemsSnap = await getDocs(itemsQ);
            budget.budgetItems = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        return budgets.length > 0 ? (month && year ? budgets[0] : budgets) : (month && year ? null : []);
    },

    createBudget: async (userId, data) => {
        const docRef = await addDoc(collection(db, COLLECTION_BUDGETS), {
            ...data,
            userId,
            createdAt: Timestamp.now()
        });
        return { id: docRef.id, ...data, userId, budgetItems: [] };
    },

    // Budget Items
    addBudgetItem: async (userId, data) => {
        const docData = {
            ...data,
            userId,
            amount: parseFloat(data.amount),
            spent: 0,
            budgetId: data.budget?.id || data.budgetId
        };
        delete docData.budget;
        const docRef = await addDoc(collection(db, COLLECTION_BUDGET_ITEMS), docData);
        return { id: docRef.id, ...docData };
    },

    updateBudgetItem: async (userId, id, data) => {
        const docRef = doc(db, COLLECTION_BUDGET_ITEMS, id);
        // Security check: verify ownership before update (client-side)
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().userId !== userId) throw new Error("Unauthorized");

        const updateData = { ...data };
        if (updateData.amount) updateData.amount = parseFloat(updateData.amount);
        await updateDoc(docRef, updateData);
        return { id, ...updateData };
    },

    deleteBudgetItem: async (userId, id) => {
        const docRef = doc(db, COLLECTION_BUDGET_ITEMS, id);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().userId !== userId) throw new Error("Unauthorized");
        await deleteDoc(docRef);
    },

    // Categories
    getCategories: async (userId) => {
        const q = query(
            collection(db, COLLECTION_CATEGORIES),
            where("userId", "==", userId)
        );
        const snap = await getDocs(q);
        const userCats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Inject system default if not already present (optional but good for consistency)
        const systemUncategorized = {
            id: 'system-uncategorized',
            name: 'Uncategorized',
            isSystem: true
        };

        return [systemUncategorized, ...userCats];
    },

    saveCategory: async (userId, data) => {
        if (data.id === 'system-uncategorized') throw new Error("Cannot modify system category");
        if (data.id) {
            const docRef = doc(db, COLLECTION_CATEGORIES, data.id);
            await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
            return { ...data };
        }
        const docRef = await addDoc(collection(db, COLLECTION_CATEGORIES), {
            ...data,
            userId,
            createdAt: Timestamp.now()
        });
        return { id: docRef.id, ...data };
    },

    deleteCategory: async (userId, id) => {
        if (id === 'system-uncategorized') throw new Error("Cannot delete system category");
        const docRef = doc(db, COLLECTION_CATEGORIES, id);
        await deleteDoc(docRef);
    },

    // Checklist Items
    getChecklistItems: async (userId, params) => {
        const { month, year } = params || {};
        let q = query(
            collection(db, COLLECTION_CHECKLIST_ITEMS),
            where("userId", "==", userId)
        );

        if (month && year) {
            q = query(q, where("month", "==", parseInt(month)), where("year", "==", parseInt(year)));
        }

        const snap = await getDocs(q);
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort in memory to avoid requiring a composite index
        return items.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
    },

    // Real-time listener for checklist items — returns unsubscribe fn
    subscribeToChecklistItems: (userId, { month, year }, callback) => {
        let q = query(
            collection(db, COLLECTION_CHECKLIST_ITEMS),
            where("userId", "==", userId)
        );
        if (month && year) {
            q = query(q, where("month", "==", parseInt(month)), where("year", "==", parseInt(year)));
        }
        return onSnapshot(q, (snap) => {
            const items = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
            callback(items);
        });
    },

    addChecklistItem: async (userId, data) => {
        const docRef = await addDoc(collection(db, COLLECTION_CHECKLIST_ITEMS), {
            ...data,
            userId,
            completed: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return { id: docRef.id, ...data, completed: false };
    },

    updateChecklistItem: async (userId, id, data) => {
        const docRef = doc(db, COLLECTION_CHECKLIST_ITEMS, id);
        await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
        return { id, ...data };
    },

    deleteChecklistItem: async (userId, id) => {
        const docRef = doc(db, COLLECTION_CHECKLIST_ITEMS, id);
        await deleteDoc(docRef);
    },

    // Creates a share record pointing to the live items (by owner + group + month/year)
    createChecklistShare: async (userId, { group, month, year }) => {
        const res = await addDoc(collection(db, COLLECTION_CHECKLIST_SHARES), {
            createdBy: userId,
            group,      // null means "all groups"
            month,
            year,
            createdAt: Timestamp.now()
        });
        return { id: res.id };
    },

    getChecklistShare: async (id) => {
        const docRef = doc(db, COLLECTION_CHECKLIST_SHARES, id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) throw new Error("Share not found");
        return { id: snap.id, ...snap.data() };
    },

    // Real-time listener for a shared group — viewers can toggle but not delete
    subscribeToSharedItems: (shareData, callback) => {
        const { createdBy, group, month, year } = shareData;
        let q = query(
            collection(db, COLLECTION_CHECKLIST_ITEMS),
            where("userId", "==", createdBy),
            where("month", "==", parseInt(month)),
            where("year", "==", parseInt(year))
        );
        if (group) {
            q = query(q, where("group", "==", group));
        }
        return onSnapshot(q, (snap) => {
            const items = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
            callback(items);
        });
    },

    // Bridge for existing code - requires userId in config or data
    get: async (path, config) => {
        const userId = config?.userId;
        if (!userId) throw new Error("userId required for API calls");

        if (path === '/budgets') return { data: await api.getBudgets(userId, config?.params) };
        if (path.startsWith('/transactions')) return { data: await api.getTransactions(userId, config?.params) };
        if (path === '/categories') return { data: await api.getCategories(userId) };
        if (path === '/checklist-items') return { data: await api.getChecklistItems(userId, config?.params) };
        if (path.startsWith('/checklist-shares/')) {
            const id = path.split('/').pop();
            return { data: await api.getChecklistShare(id) };
        }
        throw new Error(`GET path not implemented: ${path}`);
    },

    post: async (path, data, config) => {
        const userId = data?.userId || config?.userId;
        if (!userId) throw new Error("userId required for API calls");

        if (path === '/transactions') return { data: await api.addTransaction(userId, data) };
        if (path === '/budgets') return { data: await api.createBudget(userId, data) };
        if (path === '/budget-items') return { data: await api.addBudgetItem(userId, data) };
        if (path === '/categories') return { data: await api.saveCategory(userId, data) };
        if (path === '/checklist-items') return { data: await api.addChecklistItem(userId, data) };
        if (path === '/checklist-shares') return { data: await api.createChecklistShare(userId, data) };
        throw new Error(`POST path not implemented: ${path}`);
    },

    put: async (path, data, config) => {
        const userId = data?.userId || config?.userId;
        if (!userId) throw new Error("userId required for API calls");

        if (path.startsWith('/budget-items/')) {
            const id = path.split('/').pop();
            return { data: await api.updateBudgetItem(userId, id, data) };
        }
        if (path.startsWith('/transactions/')) {
            const id = path.split('/').pop();
            return { data: await api.updateTransaction(userId, id, data) };
        }
        if (path.startsWith('/checklist-items/')) {
            const id = path.split('/').pop();
            return { data: await api.updateChecklistItem(userId, id, data) };
        }
        throw new Error(`PUT path not implemented: ${path}`);
    },

    delete: async (path, config) => {
        const userId = config?.userId;
        if (!userId) throw new Error("userId required for API calls");

        const parts = path.split('/');
        const id = parts.pop();

        if (path.startsWith('/budget-items/')) {
            await api.deleteBudgetItem(userId, id);
            return { data: null };
        }
        if (path.startsWith('/categories/')) {
            await api.deleteCategory(userId, id);
            return { data: null };
        }
        if (path.startsWith('/transactions/')) {
            await api.deleteTransaction(userId, id);
            return { data: null };
        }
        if (path.startsWith('/checklist-items/')) {
            await api.deleteChecklistItem(userId, id);
            return { data: null };
        }
        throw new Error(`DELETE path not implemented: ${path}`);
    }
};

export default api;
