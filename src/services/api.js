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
    onSnapshot,
    arrayUnion,
    arrayRemove
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_TRANSACTIONS = "transactions";
const COLLECTION_BUDGETS = "budgets";
const COLLECTION_CATEGORIES = "categories";
const COLLECTION_BUDGET_ITEMS = "budgetItems";
const COLLECTION_CHECKLIST_ITEMS = "checklistItems";
const COLLECTION_CHECKLIST_SHARES = "checklistShares";
const COLLECTION_USERS = "users";

const api = {
    // User Profiles
    saveUserProfile: async (uid, email, displayName) => {
        await setDoc(doc(db, COLLECTION_USERS, uid), {
            uid,
            email: email.toLowerCase(),
            displayName: displayName || email.split('@')[0],
            updatedAt: Timestamp.now()
        }, { merge: true });
    },

    getUserByEmail: async (email) => {
        const q = query(
            collection(db, COLLECTION_USERS),
            where("email", "==", email.toLowerCase())
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
    },

    // Transactions
    getTransactions: async (userId, params) => {
        const { month, year } = params || {};

        // Get the budget the user has access to (owned or shared) for this month/year
        // to find all budget item IDs they should see transactions for
        let budgetItemIds = [];
        if (month && year) {
            const budget = await api.getBudgets(userId, { month, year });
            if (budget && budget.budgetItems) {
                budgetItemIds = budget.budgetItems.map(item => item.id);
            }
        }

        // Query 1: Transactions owned by user
        let ownedQ = query(collection(db, COLLECTION_TRANSACTIONS), where("userId", "==", userId));
        if (month && year) {
            ownedQ = query(ownedQ, where("month", "==", parseInt(month)), where("year", "==", parseInt(year)));
        }
        const ownedSnap = await getDocs(ownedQ);

        // Query 2: Transactions linked to shared budget items (if any)
        let sharedTransactions = [];
        if (budgetItemIds.length > 0) {
            // Firestore 'in' queries are limited to 30 items, so batch if needed
            const batches = [];
            for (let i = 0; i < budgetItemIds.length; i += 30) {
                batches.push(budgetItemIds.slice(i, i + 30));
            }
            for (const batch of batches) {
                let sharedQ = query(
                    collection(db, COLLECTION_TRANSACTIONS),
                    where("budgetItem.id", "in", batch)
                );
                if (month && year) {
                    sharedQ = query(sharedQ, where("month", "==", parseInt(month)), where("year", "==", parseInt(year)));
                }
                const sharedSnap = await getDocs(sharedQ);
                sharedTransactions.push(...sharedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        }

        // Merge and deduplicate
        const transactionMap = new Map();
        ownedSnap.docs.forEach(d => transactionMap.set(d.id, { id: d.id, ...d.data() }));
        sharedTransactions.forEach(t => transactionMap.set(t.id, t));
        const transactions = Array.from(transactionMap.values());

        // Sort in memory: Primary by date (desc), Secondary by createdAt (desc)
        return transactions.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) return dateB - dateA;
            return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        });
    },

    addTransaction: async (userId, data) => {
        // Parse date string directly to avoid timezone issues
        // data.date is in format "YYYY-MM-DD"
        const [year, month] = data.date.split('-').map(Number);
        
        const docData = {
            ...data,
            userId,
            amount: parseFloat(data.amount),
            month,
            year,
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
        // Parse date string directly to avoid timezone issues
        const [updYear, updMonth] = data.date.split('-').map(Number);
        const updateData = {
            ...data,
            amount: newAmount,
            month: updMonth,
            year: updYear,
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

        // Query 1: budgets owned by user
        let ownedQ = query(collection(db, COLLECTION_BUDGETS), where("userId", "==", userId));
        if (month && year) {
            ownedQ = query(ownedQ, where("month", "==", parseInt(month)), where("year", "==", parseInt(year)));
        }

        // Query 2: budgets shared with user
        let sharedQ = query(collection(db, COLLECTION_BUDGETS), where("sharedWith", "array-contains", userId));
        if (month && year) {
            sharedQ = query(sharedQ, where("month", "==", parseInt(month)), where("year", "==", parseInt(year)));
        }

        const [ownedSnap, sharedSnap] = await Promise.all([getDocs(ownedQ), getDocs(sharedQ)]);

        // Merge and deduplicate
        const budgetMap = new Map();
        ownedSnap.docs.forEach(d => budgetMap.set(d.id, { id: d.id, ...d.data() }));
        sharedSnap.docs.forEach(d => budgetMap.set(d.id, { id: d.id, ...d.data() }));
        const budgets = Array.from(budgetMap.values());

        // Fetch items for each budget by budgetId only (all members' items)
        for (let budget of budgets) {
            const itemsQ = query(collection(db, COLLECTION_BUDGET_ITEMS),
                where("budgetId", "==", budget.id)
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
            sharedWith: [],
            createdAt: Timestamp.now()
        });
        return { id: docRef.id, ...data, userId, sharedWith: [], budgetItems: [] };
    },

    copyPreviousBudget: async (userId, data) => {
        const { month, year } = data;
        let prevMonth = month - 1;
        let prevYear = year;
        if (prevMonth === 0) { prevMonth = 12; prevYear = year - 1; }

        const prevBudget = await api.getBudgets(userId, { month: prevMonth, year: prevYear });
        if (!prevBudget || !prevBudget.budgetItems || prevBudget.budgetItems.length === 0) {
            throw { response: { data: { message: "Could not find a budget from the previous month to copy from." } } };
        }

        const newBudget = await api.createBudget(userId, { month, year });

        for (const item of prevBudget.budgetItems) {
            await api.addBudgetItem(userId, { name: item.name, amount: item.amount, budgetId: newBudget.id });
        }

        return await api.getBudgets(userId, { month, year });
    },

    // Budget Items
    addBudgetItem: async (userId, data) => {
        const budgetId = data.budget?.id || data.budgetId;
        // Verify user has access to this budget
        if (budgetId) {
            const budgetSnap = await getDoc(doc(db, COLLECTION_BUDGETS, budgetId));
            if (budgetSnap.exists()) {
                const bd = budgetSnap.data();
                if (bd.userId !== userId && !(bd.sharedWith || []).includes(userId)) {
                    throw new Error("Unauthorized");
                }
            }
        }
        const docData = {
            ...data,
            userId,
            amount: parseFloat(data.amount),
            spent: 0,
            budgetId
        };
        delete docData.budget;
        const docRef = await addDoc(collection(db, COLLECTION_BUDGET_ITEMS), docData);
        return { id: docRef.id, ...docData };
    },

    // Helper: check if userId has access to the budget that owns a given item
    _checkBudgetAccess: async (userId, itemData) => {
        if (itemData.userId === userId) return true;
        if (!itemData.budgetId) return false;
        const budgetSnap = await getDoc(doc(db, COLLECTION_BUDGETS, itemData.budgetId));
        if (!budgetSnap.exists()) return false;
        const bd = budgetSnap.data();
        return bd.userId === userId || (bd.sharedWith || []).includes(userId);
    },

    updateBudgetItem: async (userId, id, data) => {
        const docRef = doc(db, COLLECTION_BUDGET_ITEMS, id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) throw new Error("Budget item not found");
        const hasAccess = await api._checkBudgetAccess(userId, snap.data());
        if (!hasAccess) throw new Error("Unauthorized");

        const updateData = { ...data };
        if (updateData.amount) updateData.amount = parseFloat(updateData.amount);
        await updateDoc(docRef, updateData);
        return { id, ...updateData };
    },

    deleteBudgetItem: async (userId, id) => {
        const docRef = doc(db, COLLECTION_BUDGET_ITEMS, id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return;
        const hasAccess = await api._checkBudgetAccess(userId, snap.data());
        if (!hasAccess) throw new Error("Unauthorized");
        await deleteDoc(docRef);
    },

    // Budget Sharing
    shareBudget: async (userId, budgetId, email) => {
        const targetUser = await api.getUserByEmail(email);
        if (!targetUser) throw new Error("No user found with that email address.");
        if (targetUser.uid === userId) throw new Error("You can't share a budget with yourself.");

        const budgetRef = doc(db, COLLECTION_BUDGETS, budgetId);
        const budgetSnap = await getDoc(budgetRef);
        if (!budgetSnap.exists()) throw new Error("Budget not found.");
        const budgetData = budgetSnap.data();
        if (budgetData.userId !== userId) throw new Error("Only the budget owner can share.");
        if ((budgetData.sharedWith || []).includes(targetUser.uid)) {
            throw new Error("Budget is already shared with this user.");
        }

        // Reconciliation: if target user has their own budget for same month/year,
        // move their items into this shared budget and delete their old budget.
        const existingQ = query(
            collection(db, COLLECTION_BUDGETS),
            where("userId", "==", targetUser.uid),
            where("month", "==", budgetData.month),
            where("year", "==", budgetData.year)
        );
        const existingSnap = await getDocs(existingQ);
        let mergedCount = 0;

        for (const existingDoc of existingSnap.docs) {
            const itemsQ = query(
                collection(db, COLLECTION_BUDGET_ITEMS),
                where("budgetId", "==", existingDoc.id)
            );
            const itemsSnap = await getDocs(itemsQ);

            // Move each item to the shared budget (keeps same doc ID so transaction refs stay valid)
            for (const itemDoc of itemsSnap.docs) {
                await updateDoc(doc(db, COLLECTION_BUDGET_ITEMS, itemDoc.id), {
                    budgetId: budgetId
                });
                mergedCount++;
            }

            // Delete the now-empty old budget
            await deleteDoc(doc(db, COLLECTION_BUDGETS, existingDoc.id));
        }

        // Add target user to sharedWith
        await updateDoc(budgetRef, {
            sharedWith: arrayUnion(targetUser.uid)
        });

        return {
            success: true,
            mergedCount,
            targetUser: { uid: targetUser.uid, email: targetUser.email, displayName: targetUser.displayName }
        };
    },

    unshareBudget: async (userId, budgetId, targetUid) => {
        const budgetRef = doc(db, COLLECTION_BUDGETS, budgetId);
        const budgetSnap = await getDoc(budgetRef);
        if (!budgetSnap.exists()) throw new Error("Budget not found.");
        const budgetData = budgetSnap.data();
        if (budgetData.userId !== userId) throw new Error("Only the budget owner can manage sharing.");

        await updateDoc(budgetRef, {
            sharedWith: arrayRemove(targetUid)
        });
    },

    getSharedMembers: async (budgetId) => {
        const budgetRef = doc(db, COLLECTION_BUDGETS, budgetId);
        const budgetSnap = await getDoc(budgetRef);
        if (!budgetSnap.exists()) return [];

        const budgetData = budgetSnap.data();
        const sharedWith = budgetData.sharedWith || [];

        const members = [];

        // Owner
        const ownerDoc = await getDoc(doc(db, COLLECTION_USERS, budgetData.userId));
        if (ownerDoc.exists()) {
            members.push({ ...ownerDoc.data(), isOwner: true });
        }

        // Shared members
        for (const uid of sharedWith) {
            const userDoc = await getDoc(doc(db, COLLECTION_USERS, uid));
            if (userDoc.exists()) {
                members.push({ ...userDoc.data(), isOwner: false });
            }
        }

        return members;
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
        if (path === '/budgets/copy-previous') return { data: await api.copyPreviousBudget(userId, data) };
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
