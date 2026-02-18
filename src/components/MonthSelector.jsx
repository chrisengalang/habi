import React from 'react';

function MonthSelector({ selectedDate, onDateChange }) {
    const handleChange = (e) => {
        const [year, month] = e.target.value.split('-');
        const newDate = new Date(selectedDate);
        newDate.setFullYear(parseInt(year));
        newDate.setMonth(parseInt(month) - 1);
        onDateChange(newDate);
    };

    // Format: YYYY-MM
    const value = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;

    return (
        <div className="flex items-center bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-color)] shadow-sm">
            <input
                type="month"
                value={value}
                onChange={handleChange}
                className="p-1 px-3 rounded bg-transparent font-medium text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-color)] cursor-pointer appearance-none"
            />
        </div>
    );
}

export default MonthSelector;
