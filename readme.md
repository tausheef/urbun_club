<div align="center">

# 🚚 Urban Club Logistics Management System

### A full-stack, modern logistics management platform built with the MERN stack

[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Module Breakdown](#-module-breakdown)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Folder Structure](#-folder-structure)

---

## 🌟 Overview

**Urban Club Logistics Management System** is a comprehensive, production-grade web application designed to manage end-to-end logistics operations. From booking dockets and tracking shipments to managing co-loaders and generating MIS reports — everything is handled in one unified platform.

The system supports **role-based access control**, real-time **activity tracking**, **image uploads via Cloudinary**, **E-way Bill management**, and much more — all wrapped in a clean, responsive UI.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router v6, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT + Google OAuth 2.0 |
| **File Storage** | Cloudinary |
| **State Management** | React Context API |
| **HTTP Client** | Axios |
| **Export** | SheetJS (XLSX) |
| **PDF** | HTML to PDF (custom render) |

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based secure login system
- Google OAuth 2.0 social login
- Role-based access control (**Admin** vs **User**)
- Protected routes with automatic token refresh
- Persistent sessions via localStorage

### 📦 Docket Management
- Create, view, update, and cancel dockets
- Auto-generated docket numbers with sequential counter
- Soft-delete / cancellation with reason tracking
- Restore cancelled dockets (Admin only)
- Rich docket data: consignor, consignee, dimensions, invoice, e-way bill
- Distance auto-calculation between origin and destination

### 📍 Activity & Shipment Tracking
- Add activity updates per docket (location, date, time, status)
- Pre-defined status suggestions + custom status input
- Quick action buttons: **Delivered** / **Undelivered**
- Full activity history per docket
- Real-time status reflected across all modules

### 📸 Proof of Delivery (POD)
- Upload POD images directly from the activity form
- Dedicated POD management page for all delivered dockets
- Upload, preview, and delete POD images
- Cloudinary CDN storage with public URL access
- Missing POD tracker with statistics

### 🚛 Co-Loader Management
- Link external transport companies (co-loaders) to existing dockets
- One-to-one docket-to-co-loader relationship enforced
- Fields: Transport Name, Transport Docket No, Challan image
- Docket automatically flagged (`coLoader: true`) on assignment
- Orange row highlight in Total Booking for co-loader dockets
- Co-loader badge visible in docket view
- Admin-only modification and deletion

### 🧾 Invoice & E-way Bill
- Full invoice details per docket
- E-way Bill number tracking
- Expiry date auto-calculation based on distance
- Expired E-way Bill alerts dashboard
- Export expired bills to Excel

### 📊 MIS Reports
- Month-wise and year-wise booking reports
- Filter by date range
- Export reports to Excel (`.xlsx`)
- Summary statistics: total bookings, delivered, pending, cancelled

### 📁 Total Booking View
- Paginated table of all active dockets
- Columns: Docket, Booking Date, Delivery, Mode, From, To, Consignee, Consignor, Status
- Live activity status fetched per docket
- Orange row highlight for co-loader linked dockets
- Month/Year filter with one-click clear
- Export to Excel

### 📄 PDF Generation
- Generate professional docket PDF from HTML
- Opens in new tab for print/download
- Includes all docket, invoice, consignor, consignee details

### 🔄 RTO (Return to Origin)
- Toggle RTO status per docket
- Dedicated RTO dockets view
- Activity-based RTO detection

### 📂 Delivery Status Modules
- **Delivered** — All dockets with "Delivered" status
- **Undelivered** — Dockets marked as undelivered
- **Pending** — Dockets with no delivery update
- **RTO** — Return to origin dockets

---

### DNS Setup (GoDaddy)
```
yourdomain.com        → CNAME → yourapp.vercel.app
api.yourdomain.com    → CNAME → yourapi.onrender.com
```

---

## 📃 License

This project is proprietary software owned by **Urban Club Pvt. Ltd.**  
Unauthorized copying, distribution, or use is strictly prohibited.

---

<div align="center">

Made with ❤️ by the **Tausheef Raza**

*Built on the MERN Stack — Fast, Scalable, Modern*

</div>