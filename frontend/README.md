# Library Management System - Frontend

A modern, responsive React frontend for the Library Management System built with TypeScript, Ant Design, and React Router.

## Features

### 🔐 Authentication
- **User Registration**: Secure registration with email validation
- **User Login**: JWT-based authentication
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Logout**: Secure session termination

### 📚 Book Management
- **Browse Books**: View all available books with search functionality
- **Book Status**: Real-time status tracking (Available/Borrowed)
- **Search**: Filter books by title or author
- **Responsive Design**: Works on desktop, tablet, and mobile

### 📖 Borrowing System
- **Borrow Books**: One-click borrowing for available books
- **Return Books**: Easy book return with automatic queue processing
- **Due Date Tracking**: Visual indicators for overdue books
- **Borrowing History**: Complete history of all borrowings

### 📋 Reservation System
- **Reserve Books**: Queue for borrowed books
- **Queue Position**: See your position in the reservation queue
- **Cancel Reservations**: Remove yourself from the queue
- **Automatic Processing**: Books automatically borrowed when returned

### 📊 Dashboard
- **Statistics Overview**: Total books, borrowed books, reservations, overdue books
- **Quick Actions**: Direct navigation to key features
- **Real-time Updates**: Live data from the backend

## Technology Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Ant Design**: Professional UI components
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication
- **JWT**: Secure authentication

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── api.ts              # API configuration and interceptors
│   ├── components/
│   │   ├── Layout.tsx          # Shared layout component
│   │   ├── LoginForm.tsx       # Login form component
│   │   ├── ReserveButton.tsx   # Book reservation button
│   │   └── BorrowButton.tsx    # Book borrowing button
│   ├── pages/
│   │   ├── DashboardPage.tsx   # Main dashboard
│   │   ├── BooksPage.tsx       # Book browsing and search
│   │   ├── MyBorrowingsPage.tsx # User's borrowing history
│   │   ├── MyReservationsPage.tsx # User's reservations
│   │   └── RegisterPage.tsx    # User registration
│   ├── App.tsx                 # Main app with routing
│   └── index.tsx               # App entry point
├── public/                     # Static assets
└── package.json               # Dependencies and scripts
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Backend server running on port 4000

### Installation

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Open your browser**:
   Navigate to `http://localhost:3000`

### Environment Variables

Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:4000
```

## API Integration

The frontend communicates with the backend through the following endpoints:

### Authentication
- `POST /users/register` - User registration
- `POST /users/login` - User login

### Books
- `GET /books` - Get all books
- `POST /books` - Add new book (admin only)

### Borrowings
- `GET /borrowings/my-borrowings` - Get user's borrowings
- `POST /borrowings/borrow/:bookId` - Borrow a book
- `POST /borrowings/return/:bookId` - Return a book

### Reservations
- `GET /reservations` - Get user's reservations
- `POST /reservations/:bookId` - Reserve a book
- `DELETE /reservations/:reservationId` - Cancel reservation

## Key Features

### 🔒 Authentication Flow
1. User registers/logs in
2. JWT token stored in localStorage
3. Token automatically included in API requests
4. Protected routes check for valid token
5. Automatic logout on token expiration

### 📱 Responsive Design
- Mobile-first approach
- Collapsible sidebar on mobile
- Touch-friendly buttons and interactions
- Optimized table layouts for small screens

### ⚡ Real-time Updates
- Automatic data refresh after actions
- Loading states for better UX
- Error handling with user-friendly messages
- Optimistic updates where appropriate

### 🎨 Modern UI/UX
- Clean, professional design
- Consistent color scheme and typography
- Intuitive navigation
- Clear visual feedback for all actions

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Style

- TypeScript for type safety
- Functional components with hooks
- Consistent naming conventions
- Proper error handling
- Responsive design patterns

## Deployment

### Build for Production
```bash
npm run build
```

The build folder contains the optimized production build.

### Environment Setup
Ensure the backend API URL is correctly configured for your production environment.

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test on multiple screen sizes
4. Update documentation for new features

## Support

For issues or questions:
1. Check the backend API is running
2. Verify environment variables are set correctly
3. Check browser console for errors
4. Ensure all dependencies are installed

---

Built with ❤️ using React and Ant Design
