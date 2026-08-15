"""
Service d'envoi d'emails pour LearnAI.

Utilise aiosmtplib pour l'envoi asynchrone via SMTP.
Si SMTP_ENABLED=false (développement), le code OTP est simplement loggé en console.
"""
import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


# ── Templates HTML ────────────────────────────────────────────────────────────

def _base_template(content: str) -> str:
    """Enveloppe HTML commune à tous les emails LearnAI."""
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LearnAI</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      padding: 40px 16px;
    }}
    .wrapper {{
      max-width: 520px;
      margin: 0 auto;
    }}
    .header {{
      text-align: center;
      margin-bottom: 32px;
    }}
    .logo {{
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }}
    .logo-icon {{
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }}
    .logo-text {{
      font-size: 22px;
      font-weight: 700;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}
    .card {{
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 40px 36px;
    }}
    h1 {{
      font-size: 22px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 12px;
    }}
    p {{
      font-size: 15px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 16px;
    }}
    .otp-box {{
      background-color: #0f172a;
      border: 2px solid #6366f1;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }}
    .otp-label {{
      font-size: 12px;
      font-weight: 600;
      color: #6366f1;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
    }}
    .otp-code {{
      font-size: 42px;
      font-weight: 800;
      letter-spacing: 14px;
      color: #f1f5f9;
      font-family: 'Courier New', Courier, monospace;
    }}
    .otp-expire {{
      font-size: 13px;
      color: #64748b;
      margin-top: 10px;
    }}
    .divider {{
      border: none;
      border-top: 1px solid #334155;
      margin: 28px 0;
    }}
    .footer-note {{
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
    }}
    .footer {{
      text-align: center;
      margin-top: 28px;
      font-size: 13px;
      color: #334155;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="logo">
        <span class="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
               stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </span>
        <span class="logo-text">LearnAI</span>
      </span>
    </div>
    <div class="card">
      {content}
    </div>
    <div class="footer">© 2026 LearnAI. Tous droits réservés.</div>
  </div>
</body>
</html>"""


def _email_verification_html(otp: str, nom: str, expire_minutes: int) -> str:
    content = f"""
      <h1>Vérifiez votre adresse email</h1>
      <p>Bonjour <strong style="color:#e2e8f0">{nom}</strong>,</p>
      <p>
        Merci de vous être inscrit sur <strong style="color:#e2e8f0">LearnAI</strong>.
        Pour activer votre compte, veuillez saisir le code de vérification ci-dessous.
      </p>
      <div class="otp-box">
        <div class="otp-label">Votre code de vérification</div>
        <div class="otp-code">{otp}</div>
        <div class="otp-expire">Ce code expire dans {expire_minutes} minutes.</div>
      </div>
      <hr class="divider" />
      <p class="footer-note">
        Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email en toute sécurité.
        Votre compte ne sera pas activé sans ce code.
      </p>
      <p class="footer-note">
        — L'équipe LearnAI
      </p>
    """
    return _base_template(content)


def _email_verification_text(otp: str, nom: str, expire_minutes: int) -> str:
    return f"""Bonjour {nom},

Votre code de vérification LearnAI est :

{otp}

Ce code expire dans {expire_minutes} minutes.

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.

— L'équipe LearnAI
"""


def _password_reset_html(otp: str, nom: str, expire_minutes: int) -> str:
    content = f"""
      <h1>Réinitialiser votre mot de passe</h1>
      <p>Bonjour <strong style="color:#e2e8f0">{nom}</strong>,</p>
      <p>
        Nous avons reçu une demande de réinitialisation du mot de passe associé à votre compte LearnAI.
        Utilisez le code ci-dessous pour créer un nouveau mot de passe.
      </p>
      <div class="otp-box">
        <div class="otp-label">Code de réinitialisation</div>
        <div class="otp-code">{otp}</div>
        <div class="otp-expire">Ce code expire dans {expire_minutes} minutes.</div>
      </div>
      <hr class="divider" />
      <p class="footer-note">
        Si vous n'avez pas demandé la réinitialisation de votre mot de passe, ignorez cet email.
        Votre mot de passe actuel restera inchangé.
      </p>
      <p class="footer-note">
        — L'équipe LearnAI
      </p>
    """
    return _base_template(content)


def _password_reset_text(otp: str, nom: str, expire_minutes: int) -> str:
    return f"""Bonjour {nom},

Votre code de réinitialisation de mot de passe LearnAI est :

{otp}

Ce code expire dans {expire_minutes} minutes.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

— L'équipe LearnAI
"""


# ── Envoi SMTP (synchrone, appelé depuis FastAPI via thread pool si besoin) ───

def _send_email(to_email: str, subject: str, html_body: str, text_body: str) -> None:
    """Envoie un email via SMTP. Utilise STARTTLS sur le port 587."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    context = ssl.create_default_context()
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls(context=context)
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())


def _log_otp_dev(to_email: str, subject: str, otp: str) -> None:
    """En développement (SMTP_ENABLED=false), affiche le code OTP dans les logs."""
    logger.warning(
        "\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "  [DEV] EMAIL NON ENVOYÉ — SMTP désactivé\n"
        f"  À      : {to_email}\n"
        f"  Sujet  : {subject}\n"
        f"  CODE OTP : {otp}\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )


# ── API publique du service ───────────────────────────────────────────────────

def send_verification_email(to_email: str, nom: str, otp: str) -> None:
    """Envoie le code OTP de confirmation d'email."""
    subject = "Votre code de vérification LearnAI"
    expire = settings.OTP_EXPIRE_MINUTES

    if not settings.SMTP_ENABLED:
        _log_otp_dev(to_email, subject, otp)
        return

    try:
        html = _email_verification_html(otp, nom, expire)
        text = _email_verification_text(otp, nom, expire)
        _send_email(to_email, subject, html, text)
        logger.info(f"Email de vérification envoyé à {to_email}")
    except Exception as exc:
        logger.error(f"Échec envoi email vérification à {to_email}: {exc}")
        raise RuntimeError("Impossible d'envoyer l'email de vérification.") from exc


def send_password_reset_email(to_email: str, nom: str, otp: str) -> None:
    """Envoie le code OTP de réinitialisation de mot de passe."""
    subject = "Votre code de réinitialisation LearnAI"
    expire = settings.OTP_EXPIRE_MINUTES

    if not settings.SMTP_ENABLED:
        _log_otp_dev(to_email, subject, otp)
        return

    try:
        html = _password_reset_html(otp, nom, expire)
        text = _password_reset_text(otp, nom, expire)
        _send_email(to_email, subject, html, text)
        logger.info(f"Email de réinitialisation envoyé à {to_email}")
    except Exception as exc:
        logger.error(f"Échec envoi email reset à {to_email}: {exc}")
        raise RuntimeError("Impossible d'envoyer l'email de réinitialisation.") from exc
