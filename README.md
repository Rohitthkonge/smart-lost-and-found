# 🛡️ AegisRecover — Smart Lost & Found Platform

> **A production-grade, privacy-first property recovery platform featuring double-blind automated matching, autonomous blind verification probes, UPI escrow management, and OTP-verified physical handover.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57.svg?logo=sqlite&logoColor=white)](https://sqlite.org)
[![Privacy](https://img.shields.io/badge/Privacy-Double--Blind-059669.svg)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Key Highlights

- **🔒 Strict Double-Blind Architecture:** No public browsing or open catalog of found items. Claimants cannot fish for listings or craft fraudulent claims.
- **⚡ 5-Stage Automated Matching Engine:**
  1. *Semantic Token Alignment:* Categorical normalization, brand/model keyword parsing, and high-frequency token overlaps.
  2. *Spatio-Temporal Haversine Decay:* 72-hour half-life exponential time decay combined with geographic distance penalties.
  3. *Multimodal Vision & Damage Scoring:* Detects scratches, cracks, distinctive markings, and exterior stickers.
  4. *Autonomous Blind Verification Probe:* Automatically requests photo evidence of secret flaws without revealing the secret to the finder.
  5. *Candidate Composite Scorer & Gate:* Scores candidates from 0 to 100 with dynamic threshold gating.
- **🤖 Autonomous Blind Verification Agent:** Bridges the information gap between claimant and finder without leaking private identifying details.
- **💰 Reward Escrow Vault (UPI):** Securely locks claimant rewards upon report filing and automatically marks them for UPI disbursement upon confirmed handover.
- **📱 Lost-Phone Catch-22 Protection:** Requires claimants reporting a lost phone to provide verified secondary/backup contact details.
- **🏢 Physical Custody Desk Handover Terminal:** 6-digit dynamic OTP verification terminal used by duty officers to authorize item release.
- **🌱 1-Click Realistic Demo Dataset:** Instant seeding of matching and decoy scenarios for end-to-end evaluation.

---

## 📁 Repository Structure

```text
LandF/
├── backend/
│   ├── app/
│   │   ├── config.py              # Application settings, secrets, and directories
│   │   ├── database.py            # SQLite schema, tables, and demo seed data
│   │   ├── main.py                # FastAPI app initialization and route mounting
│   │   ├── schemas.py             # Pydantic request and response schemas
│   │   ├── security.py            # Password hashing, JWT tokens, and OTP generator
│   │   ├── routers/
│   │   │   ├── admin.py           # Admin portal endpoints and demo seeder
│   │   │   ├── auth.py            # User registration and authentication
│   │   │   ├── desks.py           # Verified custody desks lookup
│   │   │   ├── found_items.py     # Found item intake (Path A Desk / Path B Direct)
│   │   │   ├── lost_items.py      # Lost item intake with escrow locking
│   │   │   ├── matching.py        # 5-stage algorithm, probes, and handover terminal
│   │   │   ├── user_status.py     # Phone/token recovery tracking
│   │   │   └── verification.py    # Phone OTP simulation
│   │   └── services/
│   ├── data/                      # Persistent SQLite database storage
│   ├── requirements.txt           # Python dependencies
│   └── run.py                     # Server entrypoint
├── frontend/
│   ├── css/
│   │   └── styles.css             # Light neutral, clean modern styling
│   ├── js/
│   │   ├── api.js                 # API client for backend communication
│   │   └── app.js                 # UI controller, forms, and interactive views
│   └── index.html                 # Single-page web application
├── uploads/                       # Item and probe photo uploads
├── .gitignore                     # Git ignore rules
├── README.md                      # Project documentation
└── RUN_INSTRUCTIONS.md            # Detailed evaluation walkthrough
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10 or newer
- Git

### 2. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/aegis-recover.git
cd aegis-recover
```

### 3. Set Up Virtual Environment & Dependencies
```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 4. Run the Application
```bash
cd backend
python run.py
```

The application will start on:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

*The FastAPI backend automatically serves the responsive frontend and static file uploads.*

---

## 🔑 Default Credentials & Keys

| Feature | Value | Purpose |
| :--- | :--- | :--- |
| **Admin Portal PIN** | `admin123` | Access admin operations, matching runs, and handover terminal |
| **Master Test OTP** | `123456` | Bypasses SMS gateway for instant phone verification |
| **Default Port** | `8000` | Customizable via `PORT` environment variable |

---

## 🧪 Interactive Walkthrough

1. **Visit the Portal:** Open [http://127.0.0.1:8000](http://127.0.0.1:8000)
2. **Load Demo Scenario:** Open the **Admin Portal** (PIN: `admin123`) and click **Seed Demo Scenario**:
   - **Lost Item:** Apple MacBook Pro 14 M2 (Claimant: Aarav Sharma, ₹2,000 reward escrow)
   - **Matching Found Item:** MacBook in Dark Cover (Finder: Rahul Verma, located ~50m away)
   - **Decoy Item:** Silver Water Bottle (Finder: Amit Kumar, located ~3.5km away)
3. **Execute 5-Stage Matching Engine:** Click **Run 5-Stage Engine** in the Admin Portal to observe the stepped pipeline:
   - Evaluates spatio-temporal distance, category, and token similarity.
   - Detects the match and dispatches an Autonomous Blind Probe (`"Please take a photo of the right hinge area"`).
4. **Answer Probe as Finder:** Open **User Dashboard** -> Look up Finder (`+91 98111 22334`), inspect the neutral request, and submit a photo.
5. **Verify Handover:** Enter the dynamic 6-digit release passcode in the **Physical Handover Desk Terminal** to mark the item `RESOLVED` and disburse escrow.

---

## 🛡️ Security & Privacy Architecture

- **Zero Public Browse:** Prevents social engineering, serial number harvesting, and false claims.
- **Blind Probe Neutralization:** Claimant-submitted secret identifiers are transformed into neutral photographic prompts so finders never know what specific defect or marker is being inspected.
- **Dynamic Handover Passcodes:** Time-limited, 6-digit crypto-random passcodes generated only when all verification criteria are met.
- **Immutable Audit Trail:** All matching decisions, probe responses, and custody transfers are logged with SHA-256 hashes.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
# smart-lost-and-found
