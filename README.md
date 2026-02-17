<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Moneyboy

Monthly finance manager PWA with Catppuccin Mocha theme. Track income, fixed and variable expenses, split costs, and visualize your cash flow.

## Features

- Dashboard with budget calculation (income - fixed - variable expenses)
- CRUD for income/expenses with category autosuggest
- Split costs (50/50)
- Sankey chart for cash flow visualization (income → budget → expense categories)
- Pie chart analysis by expense category
- Category management (rename, delete)
- Firebase Firestore sync or offline localStorage mode
- Authentication (Firebase Auth or local demo mode)
- Docker deployment via nginx

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Docker

```bash
docker build -t moneyboy .
docker run -p 80:80 moneyboy
```
