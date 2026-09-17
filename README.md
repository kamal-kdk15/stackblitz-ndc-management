# NDC Management System

A web-based **NDC (National Drug Code) Management System** designed to manage pharmaceutical product, package, NDC, user, and audit information through a role-based workflow.

The system provides a centralized interface for managing product and package information, generating and maintaining NDC records, controlling user access, and tracking important system activities through audit logs.

## Live Application

**Vercel Deployment:**
https://stackblitz-ndc.vercel.app/

## Overview

The NDC Management System is designed around the workflow involved in managing pharmaceutical product and package information.

The application provides different levels of access for users and separates operational responsibilities using role-based access control.

The system uses the FDA-assigned labeler code:

```text
70095
```

NDCs are represented using the standard 10-digit NDC format:

```text
70095-001-01
```

where:

* `70095` → Labeler Code
* `001` → Product Code
* `01` → Package Code

## Features

### Product Management

* Create and manage pharmaceutical products
* Assign unique 3-digit product codes
* Store product name, strength, dosage form, Rx/OTC classification, and ANDA number
* Edit product information based on user permissions
* Track product status

### Package Management

* Create packages associated with products
* Assign unique 2-digit package codes
* Store package size, unit, and description
* Prevent duplicate product/package combinations
* Manage package information through the application

### NDC Registry

* View registered NDC records
* Display complete NDC values
* Search and filter registry data
* Track associated product and package information
* Support table-level filtering and pagination

### Role-Based Access Control

The application supports three primary roles:

| Role       | Access                                            |
| ---------- | ------------------------------------------------- |
| **Admin**  | Full system and user management access            |
| **SPOC**   | Product, package, and operational data management |
| **Viewer** | Read-only access                                  |

Administrators can manage users and control active/inactive SPOC access.

### Audit Logging

Important system activities are recorded through audit logs.

The audit system is designed to track:

* User performing an action
* Action type
* Affected record
* Previous value
* New value
* Timestamp

This provides traceability for changes made within the system.

### Authentication

The application includes authenticated access and role-based authorization to ensure users can only perform actions permitted by their assigned role.

## Technology Stack

### Frontend

* **Next.js**
* **React**
* **JavaScript**
* **CSS**

### Backend

* **Next.js API Routes**
* REST-style API endpoints

### Database

* **PostgreSQL** during the initial application development
* **Microsoft SQL Server** for database migration/development

### Deployment

* **Vercel**

## Project Structure

```text
stackblitz-ndc/
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── products/
│   │   ├── packages/
│   │   ├── ndc/
│   │   ├── users/
│   │   └── audit/
│   │
│   ├── dashboard/
│   ├── products/
│   ├── packages/
│   ├── ndc-registry/
│   └── audit/
│
├── components/
│
├── lib/
│   └── jsonDB/
│
├── public/
│
├── package.json
└── README.md
```

> The exact folder structure may change as the application continues to evolve.

## Database Design

The core database entities include:

### Products

Stores pharmaceutical product information.

```text
products
├── id
├── product_code
├── product_name
├── strength
├── dosage_form
├── rx_otc
├── anda_number
├── status
├── created_by
└── created_at
```

### Packages

Stores package information associated with products.

```text
packages
├── id
├── product_id / product_code
├── package_code
├── package_size
├── unit
├── description
├── created_by
└── created_at
```

### Users

Stores application users and their assigned roles.

```text
users
├── id
├── name
├── email
├── password
├── role
├── status
└── created_at
```

### Audit Log

Stores system activity and changes.

```text
audit_log
├── id
├── action
├── performed_by
├── record_id
├── old_value
├── new_value
└── timestamp
```

## NDC Structure

The application follows the three-part NDC structure:

```text
Labeler Code - Product Code - Package Code
```

Example:

```text
70095-001-01
```

Product and package codes are controlled separately to maintain consistent NDC generation.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/kamal-kdk15/stackblitz-ndc-management.git
cd stackblitz-ndc-management
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root.

Example:

```env
DATABASE_URL=your_database_connection_string
```

Add any additional authentication or service-specific environment variables required by your deployment.

### 4. Run the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Deployment

The application can be deployed using **Vercel**.

Typical deployment workflow:

```text
GitHub Repository
       ↓
     Vercel
       ↓
Production Application
       ↓
Database
```

Environment variables must be configured in the Vercel project settings before deploying database-dependent functionality.

## Security Considerations

The application is designed with several security considerations:

* Role-based authorization
* Authenticated API access
* Database-backed user management
* Audit logging
* Server-side database operations
* Environment variables for sensitive configuration
* Validation of product and package codes

Production deployments should additionally use secure password hashing, appropriate session management, rate limiting, database-level permissions, and HTTPS.

## Future Improvements

Potential improvements include:

* More advanced analytics and dashboard insights
* Enhanced audit-log filtering
* Database-level audit triggers
* Improved authentication security
* Login attempt monitoring
* Advanced reporting and export functionality
* Additional validation and workflow controls
* Expanded SQL Server production integration

## Project Purpose

This project was developed to demonstrate the design and implementation of a **role-based pharmaceutical data management system** with a focus on structured data management, authentication, auditing, database integration, and deployment.

It combines frontend application development with backend API design and relational database management in a production-oriented workflow.

## Author

**Kamal Deep Kaur**

* GitHub: https://github.com/kamal-kdk15
* Portfolio: https://portfolio-u488.vercel.app/
* LinkedIn: https://www.linkedin.com/in/kamal-deep-kaur-48763123a/
