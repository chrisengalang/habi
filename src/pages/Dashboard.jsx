import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Receipt, ArrowRight, LayoutDashboard, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function Dashboard({ selectedMonth }) {
    const [summary, setSummary] = useState({ totalBudget: 0, totalCurrent: 0, totalRemaining: 0 });
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [chartData, setChartData] = useState({ categories: [], budgetItems: [] });
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (selectedMonth && user) {
            fetchDashboardData();
        }
    }, [selectedMonth, user]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const month = selectedMonth.getMonth() + 1;
            const year = selectedMonth.getFullYear();

            // Fetch Budget for summaries and budget items chart
            let budget = null;
            try {
                const res = await api.get('/budgets', { userId: user.uid, params: { month, year } });
                budget = res.data;
            } catch (e) {
                if (e.response && e.response.status !== 404) console.error(e);
            }

            // Fetch Transactions for Category Pie Chart
            const transRes = await api.get('/transactions', { userId: user.uid, params: { month, year } });
            const allTransactions = transRes.data;

            // Calculate totals
            let totalBudget = 0;
            let totalCurrent = 0;

            if (budget && budget.budgetItems) {
                totalBudget = budget.budgetItems.reduce((acc, item) => acc + (item.amount || 0), 0);
                totalCurrent = budget.budgetItems.reduce((acc, item) => acc + (item.spent || 0), 0);
            }

            setSummary({
                totalBudget,
                totalCurrent,
                totalRemaining: totalBudget - totalCurrent
            });

            // Process Budget Items for Bar Chart
            const budgetProgressData = (budget?.budgetItems || []).map(item => {
                const remaining = (item.amount || 0) - (item.spent || 0);
                const isOverspent = remaining < 0;
                const percentLeft = item.amount > 0 ? Math.max(0, (remaining / item.amount) * 100) : 0;

                return {
                    name: item.name,
                    // If overspent, we use 100% to fill the bar as "Critical/Full" but the color will distinguish it
                    displayValue: isOverspent ? 100 : percentLeft,
                    actualLeft: remaining,
                    isOverspent: isOverspent,
                    total: item.amount,
                    spent: item.spent,
                    percentLeft: percentLeft
                };
            }).sort((a, b) => {
                if (a.isOverspent && !b.isOverspent) return -1;
                if (!a.isOverspent && b.isOverspent) return 1;
                return a.percentLeft - b.percentLeft;
            });

            // Process data for charts
            const categoryMap = {};

            allTransactions.forEach(t => {
                const catName = t.category?.name || 'Uncategorized';
                categoryMap[catName] = (categoryMap[catName] || 0) + (t.amount || 0);
            });

            const categories = Object.keys(categoryMap).map(name => ({ name, value: categoryMap[name] }));

            setChartData({ categories, budgetItems: budgetProgressData });

            // Sort by date desc and take top 5
            const sorted = [...allTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
            setRecentTransactions(sorted.slice(0, 5));

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const CustomPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl outline-none">
                    <p className="text-white font-bold text-sm tracking-wide">{payload[0].name}</p>
                    <p className="text-blue-400 font-black mt-1">
                        ${payload[0].value.toFixed(2)}
                        <span className="text-slate-400 text-xs font-normal ml-2">
                            ({((payload[0].value / summary.totalCurrent) * 100).toFixed(1)}%)
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const CustomBarTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl outline-none">
                    <p className="text-white font-bold text-sm tracking-wide flex justify-between items-center gap-4">
                        {data.name}
                        {data.isOverspent && <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-black uppercase">Overboard</span>}
                    </p>
                    {data.isOverspent ? (
                        <div className="mt-1">
                            <p className="text-rose-400 font-black">
                                Overspent by ${Math.abs(data.actualLeft).toLocaleString()}
                            </p>
                            <p className="text-slate-500 text-[10px] mt-0.5">
                                Total Spent: ${data.spent.toLocaleString()} / Budget: ${data.total.toLocaleString()}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-1">
                            <p className="text-emerald-400 font-black">
                                {data.percentLeft.toFixed(1)}% Remaining
                            </p>
                            <p className="text-slate-400 text-xs mt-1">
                                ${data.actualLeft.toLocaleString()} of ${data.total.toLocaleString()} left
                            </p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    if (loading) return <div className="p-6">Loading dashboard...</div>;

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    Dashboard
                </h2>
                <span className="text-sm lg:text-base text-[var(--text-secondary)] font-medium bg-[var(--bg-secondary)] px-4 py-1.5 rounded-full border border-[var(--border-color)] shadow-sm">
                    {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
                <div className="enterprise-card p-5 sm:p-6 lg:p-8 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <h3 className="text-[var(--text-secondary)] text-[10px] sm:text-xs font-bold uppercase tracking-widest">Available Budget</h3>
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <Wallet size={18} />
                        </div>
                    </div>
                    <div className="flex items-baseline space-x-2 mt-3 sm:mt-4">
                        <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text-primary)]">${summary.totalBudget.toLocaleString()}</span>
                    </div>
                </div>

                <div className="enterprise-card p-5 sm:p-6 lg:p-8 border-l-4 border-l-rose-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <h3 className="text-[var(--text-secondary)] text-[10px] sm:text-xs font-bold uppercase tracking-widest">Total Expenses</h3>
                        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    <div className="flex items-baseline space-x-2 mt-3 sm:mt-4">
                        <span className={`text-2xl sm:text-3xl lg:text-4xl font-black ${summary.totalCurrent > summary.totalBudget ? "text-rose-600" : "text-[var(--text-primary)]"}`}>
                            ${summary.totalCurrent.toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="enterprise-card p-5 sm:p-6 lg:p-8 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow flex sm:col-span-2 lg:col-span-1">
                    <div className="w-full">
                        <div className="flex justify-between items-start">
                            <h3 className="text-[var(--text-secondary)] text-[10px] sm:text-xs font-bold uppercase tracking-widest">Remaining Balance</h3>
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <TrendingDown size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline space-x-2 mt-3 sm:mt-4">
                            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text-primary)]">${summary.totalRemaining.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <section className="enterprise-card overflow-hidden">
                    <div className="p-6 border-b border-[var(--border-color)] flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <PieChartIcon size={18} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Spending by Category</h3>
                    </div>
                    <div className="h-[300px] sm:h-[350px] lg:h-[400px] p-4 sm:p-6">
                        {chartData.categories.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData.categories}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {chartData.categories.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] space-y-4">
                                <p className="italic text-sm">No transaction data available.</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="enterprise-card overflow-hidden">
                    <div className="p-6 border-b border-[var(--border-color)] flex items-center space-x-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <BarChart3 size={18} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Budget Progress (% Left)</h3>
                    </div>
                    <div className="h-[300px] sm:h-[350px] lg:h-[400px] p-4 sm:p-6">
                        {chartData.budgetItems.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={chartData.budgetItems}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={(props) => {
                                            const { x, y, payload } = props;
                                            const data = chartData.budgetItems.find(i => i.name === payload.value);
                                            return (
                                                <text
                                                    x={x}
                                                    y={y}
                                                    dy={4}
                                                    textAnchor="end"
                                                    fill={data?.isOverspent ? '#f43f5e' : '#94a3b8'}
                                                    fontSize={12}
                                                    fontWeight={data?.isOverspent ? 800 : 600}
                                                >
                                                    {payload.value}
                                                </text>
                                            );
                                        }}
                                        width={100}
                                    />
                                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(51, 65, 85, 0.3)' }} />
                                    <Bar dataKey="displayValue" radius={[0, 4, 4, 0]} barSize={20} background={{ fill: '#1e293b', radius: [0, 4, 4, 0] }}>
                                        {chartData.budgetItems.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.isOverspent ? '#e11d48' : (entry.percentLeft < 40 ? '#f59e0b' : '#10b981')}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] space-y-4">
                                <p className="italic text-sm">No budget allocation found.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <section className="enterprise-card">
                <div className="bg-[var(--bg-primary)] p-6 border-b border-[var(--border-color)] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Recent Activity</h3>
                    <button className="text-sm font-semibold text-blue-500 hover:text-blue-600 transition-colors">View All</button>
                </div>
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                                <th className="p-6 text-xs font-bold uppercase tracking-wider">Date</th>
                                <th className="p-6 text-xs font-bold uppercase tracking-wider">Description</th>
                                <th className="p-6 text-xs font-bold uppercase tracking-wider">Category</th>
                                <th className="p-6 text-right text-xs font-bold uppercase tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {recentTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-[var(--bg-primary)] transition-colors group">
                                    <td className="p-6 text-sm text-[var(--text-secondary)]">{t.date}</td>
                                    <td className="p-6 text-sm font-semibold text-[var(--text-primary)]">{t.description}</td>
                                    <td className="p-6">
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold">
                                            {t.budgetItem ? t.budgetItem.name : (t.category ? t.category.name : '-')}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <span className="text-sm font-black text-rose-500">-${t.amount?.toFixed(2)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-[var(--border-color)]">
                    {recentTransactions.map(t => (
                        <div key={t.id} className="p-4 flex justify-between items-center bg-[var(--bg-secondary)]">
                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-bold text-[var(--text-primary)] line-clamp-1">{t.description}</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-[10px] text-[var(--text-secondary)] font-medium">{t.date}</span>
                                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full font-bold uppercase">
                                        {t.budgetItem ? t.budgetItem.name : (t.category ? t.category.name : '-')}
                                    </span>
                                </div>
                            </div>
                            <span className="text-sm font-black text-rose-500 shrink-0">-${t.amount?.toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                {recentTransactions.length === 0 && (
                    <div className="p-10 text-center text-[var(--text-secondary)] italic">
                        No recent transactions recorded.
                    </div>
                )}
            </section>
        </div>
    );
}

export default Dashboard;
