# Datenfestung - Project Structure

## Frontend (React + TypeScript)
```
datenfestung-frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DashboardWidget.tsx
│   │   │   └── NotificationCenter.tsx
│   │   ├── processing-activities/
│   │   │   ├── ProcessingActivityList.tsx
│   │   │   ├── ProcessingActivityForm.tsx
│   │   │   ├── ProcessingActivityDetail.tsx
│   │   │   └── ProcessingActivityCard.tsx
│   │   ├── toms/
│   │   │   ├── TomList.tsx
│   │   │   ├── TomForm.tsx
│   │   │   └── TomTemplates.tsx
│   │   ├── contracts/
│   │   │   ├── ContractList.tsx
│   │   │   ├── ContractForm.tsx
│   │   │   └── ContractUpload.tsx
│   │   ├── tasks/
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   └── TaskBoard.tsx
│   │   ├── elearning/
│   │   │   ├── CourseList.tsx
│   │   │   ├── CourseDetail.tsx
│   │   │   ├── Quiz.tsx
│   │   │   └── ProgressTracker.tsx
│   │   └── auth/
│   │       ├── Login.tsx
│   │       ├── Register.tsx
│   │       └── ForgotPassword.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useLocalStorage.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   └── storage.service.ts
│   ├── store/
│   │   ├── index.ts
│   │   ├── authSlice.ts
│   │   ├── dashboardSlice.ts
│   │   ├── processingActivitiesSlice.ts
│   │   └── tomsSlice.ts
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── dashboard.types.ts
│   │   ├── processing-activity.types.ts
│   │   ├── tom.types.ts
│   │   ├── contract.types.ts
│   │   ├── task.types.ts
│   │   └── elearning.types.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── validators.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── theme.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── react-app-env.d.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Backend (Node.js + Express)
```
datenfestung-backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── processing-activities.controller.ts
│   │   ├── toms.controller.ts
│   │   ├── contracts.controller.ts
│   │   ├── tasks.controller.ts
│   │   └── elearning.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── upload.middleware.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── ProcessingActivity.ts
│   │   ├── Tom.ts
│   │   ├── Contract.ts
│   │   ├── Task.ts
│   │   └── Course.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── processing-activities.routes.ts
│   │   ├── toms.routes.ts
│   │   ├── contracts.routes.ts
│   │   ├── tasks.routes.ts
│   │   └── elearning.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   ├── file.service.ts
│   │   └── notification.service.ts
│   ├── utils/
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── types/
│   │   └── express.d.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   └── app.config.ts
│   └── app.ts
├── uploads/
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```