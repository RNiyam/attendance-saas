# Backend Setup

## Environment

Create `backend/.env` with at least `DATABASE_URL`, JWT secrets, and any SMTP keys you use. Keep secrets only in `.env` (gitignored).

Example `DATABASE_URL` shape:

```env
DATABASE_URL=mysql://USER:PASSWORD@127.0.0.1:3306/DATABASE_NAME
```

`npm run db:migrate` connects using `DATABASE_URL` from `.env`. Your MySQL server must already be running and reachable at that host and port.

## SMTP Email

Nodemailer is the library that talks to an SMTP provider. It does not create an email service by itself; it logs in to one sender mailbox and sends from there.

There are two different email addresses in signup:

- `ownerEmail`: the recipient entered on the signup screen.
- `SMTP_USER` / `SMTP_FROM`: the global sender account configured once in `.env`.

Signup already sends a welcome email to `ownerEmail` when SMTP is configured. Emails are skipped when any of these values are empty:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-sender-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="HRMS <your-sender-email@gmail.com>"
```

For Gmail, use an App Password for `SMTP_PASS`, not your normal Gmail password.

After changing `.env`, restart the backend. A working setup logs:

```text
[smtp] Transporter verified successfully
```

Do not email permanent passwords. If the app needs temporary passwords later, make them single-use, expire them quickly, and force the user to change the password after first login. The current signup flow lets the owner set a password and sends only the welcome/sign-in email.
