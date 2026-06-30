# Project Generation Prompt

## Objective

Build a production-ready full-stack application that recreates the first two steps of the Udyam Registration portal while keeping the architecture clean, scalable, and well documented.

## Requirements

### 1. Tech Stack

Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod

Backend
- Next.js Route Handlers (or Express if preferred)
- PostgreSQL
- Prisma ORM

Testing
- Jest
- React Testing Library
- Playwright (optional)

Deployment
- Docker support
- Environment variable configuration
- Ready for Vercel deployment

---

### 2. Web Scraping

Scrape the first two steps of the official Udyam Registration portal.

Target:
https://udyamregistration.gov.in/UdyamRegistration.aspx

Extract:

- Form fields
- Labels
- Placeholders
- Validation rules
- Required fields
- Buttons
- Radio buttons
- OTP workflow
- PAN validation workflow

Store everything inside

```
/scraped/schema.json
```

The schema should support dynamic form rendering.

---

### 3. UI

Recreate the first two steps exactly.

Requirements

- Mobile first
- Fully responsive
- Accessible
- Pixel-perfect layout
- Clean typography
- Proper spacing
- Error states
- Loading states
- Disabled states

Pages

Step 1
- Aadhaar Number
- Entrepreneur Name
- Validate & Generate OTP button

OTP Screen
- OTP input
- Timer
- Resend OTP

Step 2
- PAN Number
- PAN Type
- Validate PAN button

Add

- Progress indicator
- Form persistence
- Success screen

---

### 4. Validation

Use Zod.

Implement

Aadhaar

- 12 digits
- Numeric only

PAN

Regex

```
[A-Z]{5}[0-9]{4}[A-Z]{1}
```

OTP

- 6 digits

Display validation errors immediately.

---

### 5. Backend

Create REST APIs.

```
POST /api/otp/send

POST /api/otp/verify

POST /api/pan/validate

POST /api/submit
```

Requirements

- Validate incoming data
- Return proper HTTP status codes
- Store submissions in PostgreSQL
- Use Prisma

---

### 6. Database

Create Prisma schema.

Suggested model

```
Submission

id
aadhaar
entrepreneurName
pan
panType
otpVerified
createdAt
updatedAt
```

---

### 7. Features

Implement

- Dynamic forms from schema.json
- Reusable components
- Loading indicators
- Toast notifications
- API error handling
- Retry logic
- Responsive layout
- Dark mode support (optional)

Bonus

- Auto-fill city/state from PIN using PostPin API
- Animations
- Skeleton loaders

---

### 8. Folder Structure

```
app/

components/

lib/

hooks/

services/

prisma/

scraped/

tests/

public/
```

Follow feature-based organization.

---

### 9. Testing

Write unit tests for

- Aadhaar validation
- PAN validation
- API endpoints
- Form rendering

---

### 10. Docker

Provide

Dockerfile

docker-compose.yml

README instructions

---

### 11. Documentation

Create a professional README including

- Setup
- Installation
- Environment variables
- Database migration
- Running locally
- Running tests
- Docker
- Deployment
- Project architecture

---

### 12. Code Quality

Requirements

- Strict TypeScript
- ESLint
- Prettier
- Modular architecture
- Reusable hooks
- Reusable UI components
- Proper comments only where necessary
- Clean commit-ready code

---

### Deliverables

The final project should include

- Fully working frontend
- Backend APIs
- Prisma schema
- PostgreSQL integration
- Docker support
- Tests
- README
- Dynamic scraped schema
- Production-ready folder structure

The application should closely replicate the first two steps of the Udyam Registration portal while following modern full-stack development best practices.

                    UDYAM REGISTRATION

                           │
                           ▼
                Step 1: Aadhaar Verification
     ┌─────────────────────────────────────────────┐
     │ Aadhaar Number                              │
     │ Entrepreneur Name                           │
     │ Declaration Checkbox                        │
     │ Validate & Generate OTP Button              │
     └─────────────────────────────────────────────┘
                           │
                           ▼
                Validate Input Locally
                           │
                Aadhaar Format Correct?
                    │              │
                  No               Yes
                  │                 │
          Show Validation      Generate OTP
               Error                │
                                    ▼
                          OTP Verification
     ┌─────────────────────────────────────────────┐
     │ OTP Input                                   │
     │ Verify OTP Button                           │
     │ Resend OTP                                  │
     │ Timer                                       │
     └─────────────────────────────────────────────┘
                           │
                     OTP Verified?
                    │             │
                  No              Yes
                  │                │
         Show Error          Continue
                               │
                               ▼
                    Step 2: PAN Validation
     ┌─────────────────────────────────────────────┐
     │ PAN Number                                  │
     │ PAN Type                                    │
     │ Validate PAN Button                         │
     └─────────────────────────────────────────────┘
                           │
                    PAN Valid?
                    │            │
                  No             Yes
                  │               │
            Show Error      Save to Database
                                │
                                ▼
                           Success Screen
