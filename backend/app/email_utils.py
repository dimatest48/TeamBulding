import os
import smtplib
from email.message import EmailMessage

# Where the user lands when they click the verification link. The frontend
# reads ?token=... on this route and calls POST /auth/verify.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5173")

# If SMTP settings are present we send for real; otherwise we "send" to the
# console so the flow is fully testable in dev without an email provider.
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM", "no-reply@tasker.local")


def send_verification_email(to_email: str, name: str, token: str) -> None:
    link = f"{FRONTEND_URL}/verify?token={token}"
    subject = "Confirm your Tasker account"
    body = (
        f"Hi {name},\n\n"
        f"Welcome to Tasker! Please confirm your email by opening this link:\n\n"
        f"{link}\n\n"
        f"The link expires in 24 hours. If you didn't sign up, ignore this email.\n"
    )

    if not SMTP_HOST:
        # Dev mode: print the link so you can click it from the console.
        print("\n" + "=" * 70)
        print("[email] DEV MODE — no SMTP configured. Verification link below:")
        print(f"[email] To: {to_email}")
        print(f"[email] {link}")
        print("=" * 70 + "\n", flush=True)
        return

    _deliver(to_email, subject, body)


def send_task_share_email(
    to_email: str, inviter_name: str, task_title: str, role: str, token: str
) -> None:
    """Notify a user that a task was shared with them by email (EP-06 T-30)."""
    link = f"{FRONTEND_URL}/cabinet?task_invite={token}"
    subject = f"{inviter_name} shared a task with you on Tasker"
    body = (
        f"Hi,\n\n"
        f"{inviter_name} shared the task \"{task_title}\" with you "
        f"({role} access).\n\n"
        f"Sign in to Tasker and accept it here:\n\n{link}\n\n"
        f"You'll also find it waiting under Invitations after you log in.\n"
    )
    _deliver(to_email, subject, body)


def _deliver(to_email: str, subject: str, body: str) -> None:
    if not SMTP_HOST:
        # Dev mode: print to console so the flow is testable without SMTP.
        print("\n" + "=" * 70)
        print("[email] DEV MODE — no SMTP configured. Message below:")
        print(f"[email] To: {to_email}")
        print(f"[email] Subject: {subject}")
        print(body)
        print("=" * 70 + "\n", flush=True)
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        if SMTP_USER and SMTP_PASSWORD:
            server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
