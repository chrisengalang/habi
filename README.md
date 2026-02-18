# Habi 🧵

**Weaving Your Family Finances Together**

Habi (Filipino for "weave") is a comprehensive family budgeting and expense tracking application that helps you intricately weave together your financial goals, spending habits, and budget management.

## ✨ Features

### 📊 Dashboard
- Visual overview of your monthly budget health
- Interactive charts showing spending by category
- Budget progress indicators with overspending alerts
- Recent transaction history

### 💰 Budget Management
- Create monthly budgets with customizable budget items
- Track spending against allocated amounts in real-time
- Copy previous month's budget for consistency
- Visual indicators for budget health

### 📝 Transaction Tracking
- Log all expenses with descriptions, amounts, and dates
- Link transactions to budget items for automatic tracking
- Categorize spending for better insights
- Search, filter, and sort your transaction history

### 🏷️ Custom Categories
- Create personalized spending categories
- Organize transactions for detailed analysis
- System-managed "Uncategorized" option for flexibility

### ✅ Monthly Checklist
- Track shopping lists and financial to-dos
- Mark items as complete
- Manage monthly recurring tasks

## 🛠️ Technology Stack

- **Frontend**: React 19 + Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Backend**: Firebase (Firestore + Authentication)
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/chrisengalang/habi.git
cd habi
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Update `src/firebase.js` with your Firebase configuration

4. Update Firestore security rules:
   - Deploy the rules from `firestore.rules` to your Firebase project
   - Implement proper user-based security rules

5. Run the development server:
```bash
npm run dev
```

6. Build for production:
```bash
npm run build
```

### Firebase Deployment

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

## 📱 Progressive Web App (PWA)

Habi is designed as a Progressive Web App, allowing you to:
- Install it on your mobile device
- Use it offline (when implemented)
- Enjoy a native app-like experience

## 🗂️ Project Structure

```
habi/
├── public/              # Static assets
├── src/
│   ├── assets/         # Images and static files
│   ├── components/     # Reusable React components
│   ├── context/        # React Context (Auth)
│   ├── pages/          # Page components
│   ├── services/       # API/Firebase services
│   ├── App.jsx         # Main app component
│   ├── firebase.js     # Firebase configuration
│   └── main.jsx        # Entry point
├── firestore.rules     # Firestore security rules
├── firebase.json       # Firebase configuration
└── package.json        # Dependencies
```

## 🎨 Design Philosophy

Habi uses a metaphor of weaving - just as threads are woven together to create fabric, Habi helps you weave together:
- **Income threads** - Your earnings and budget allocations
- **Expense threads** - Your spending and transactions
- **Category threads** - Organized spending patterns
- **Time threads** - Monthly cycles and planning

The result is a complete financial tapestry that gives you clarity and control over your family's finances.

## 🔐 Security

- User authentication via Firebase Auth
- User-scoped data queries
- Firestore security rules (update before production)
- Client-side data validation

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

Private - All rights reserved

## 👨‍💻 Author

**Chris Engalang**
- GitHub: [@chrisengalang](https://github.com/chrisengalang)

---

Built with ❤️ and the Filipino spirit of *bayanihan* (community unity)
