# Loretto School Portal

A modular school management portal for Loretto School of Childhood, Nigeria.

## Features

### User Roles
- **Super Admin** - Full system control, app/permission management
- **Admin** - Staff members (teachers, accountants, registrars)
- **Parent** - Unified dashboard for all children
- **Student** - Individual academic portal

### Modular App System
- Super Admin can create and manage apps
- Apps can be assigned to specific roles, admin types, or class levels
- Flexible permission system for granular access control

### MVP Apps
**Admin Apps:**
- Student Management
- Parent Management
- Class Management
- Fee Management
- Announcements
- Results Entry

**Client Apps:**
- View Results
- Pay Fees
- Announcements
- Profile

## Tech Stack
- **Frontend**: Next.js 14 with TypeScript
- **Styling**: CSS Modules with CSS Variables
- **Auth**: JWT with phone number login
- **Database**: JSON file storage (MVP)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd loretto-portal
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Initial Setup

After starting the server, create the initial Super Admin:

```bash
curl -X POST http://localhost:3000/api/seed
```

This will create a Super Admin with:
- **Phone**: +2348012345678
- **Password**: loretto2024

**IMPORTANT**: Change these credentials after first login!

## Class Structure

- **Creche**
- **Preschool**: Preschool 1, 2, 3
- **Primary**: Grade 1-6
- **Secondary**: JSS 1-3, SSS 1-3

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── dashboard/         # Client dashboard
│   ├── super-admin/       # Super admin dashboard
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── forgot-password/   # Password reset
├── components/            # Reusable components
├── lib/                   # Utilities and database
└── types/                 # TypeScript definitions
```

## Environment Variables

Create a `.env.local` file:

```env
JWT_SECRET=your-secret-key-here
```

## Future Enhancements

- [ ] PostgreSQL database integration
- [ ] SMS/WhatsApp notifications (Twilio/SendGrid)
- [ ] Online payment integration
- [ ] Result generation and printing
- [ ] Attendance tracking
- [ ] Timetable management

## License

Private - Loretto School of Childhood

## Contact

For support, contact the school administration.
