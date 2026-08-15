"""add email verification, oauth, and otp_codes table

Revision ID: a1b2c3d4e5f6
Revises: 0f79d4ba35e7
Create Date: 2026-08-15 14:00:00.000000

Modifications :
- users : is_email_verified, email_verified_at, auth_provider, google_id, avatar_url
- users : mot_de_passe rendu nullable (comptes Google sans mdp local)
- users : reset_token conservé (compatibilité) mais déprécié
- Nouvelle table otp_codes
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '0f79d4ba35e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Créer les enums avec IF NOT EXISTS (résistant aux tentatives partielles) ──
    # On utilise op.execute() directement pour contrôler exactement le SQL émis.
    op.execute("DO $$ BEGIN CREATE TYPE authprovider AS ENUM ('email', 'google'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE otptype AS ENUM ('email_verification', 'password_reset'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")

    # ── Table users : nouvelles colonnes ──────────────────────────────────────
    # Chaque add_column est idempotent : on ignore si la colonne existe déjà
    connection = op.get_bind()

    def column_exists(table, column):
        result = connection.execute(sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
        ), {"t": table, "c": column})
        return result.fetchone() is not None

    if not column_exists('users', 'is_email_verified'):
        op.add_column('users',
            sa.Column('is_email_verified', sa.Boolean(), nullable=False, server_default='false')
        )

    if not column_exists('users', 'email_verified_at'):
        op.add_column('users',
            sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True)
        )

    if not column_exists('users', 'auth_provider'):
        op.add_column('users',
            sa.Column(
                'auth_provider',
                postgresql.ENUM('email', 'google', name='authprovider', create_type=False),
                nullable=False,
                server_default='email',
            )
        )

    if not column_exists('users', 'google_id'):
        op.add_column('users',
            sa.Column('google_id', sa.String(length=255), nullable=True)
        )

    if not column_exists('users', 'avatar_url'):
        op.add_column('users',
            sa.Column('avatar_url', sa.String(length=512), nullable=True)
        )

    # Rendre mot_de_passe nullable (comptes Google sans mot de passe local)
    op.alter_column('users', 'mot_de_passe', nullable=True)

    # Index sur google_id (ignorer si déjà existant)
    op.execute("""
        DO $$ BEGIN
            CREATE INDEX ix_users_google_id ON users (google_id);
        EXCEPTION WHEN duplicate_table THEN NULL;
        END $$;
    """)

    # ── Table otp_codes ───────────────────────────────────────────────────────
    # Vérifier si la table existe déjà avant de la créer
    table_exists = connection.execute(sa.text(
        "SELECT 1 FROM information_schema.tables "
        "WHERE table_schema='public' AND table_name='otp_codes'"
    )).fetchone()

    if not table_exists:
        op.create_table(
            'otp_codes',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column(
                'type',
                postgresql.ENUM('email_verification', 'password_reset', name='otptype', create_type=False),
                nullable=False,
            ),
            sa.Column('code_hash', sa.String(length=255), nullable=False),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('is_used', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.text("NOW()")),
            sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(op.f('ix_otp_codes_id'), 'otp_codes', ['id'], unique=False)
        op.create_index(op.f('ix_otp_codes_user_id'), 'otp_codes', ['user_id'], unique=False)


def downgrade() -> None:
    # ── Supprimer la table otp_codes ──────────────────────────────────────────
    op.execute("DROP INDEX IF EXISTS ix_otp_codes_user_id")
    op.execute("DROP INDEX IF EXISTS ix_otp_codes_id")
    op.drop_table('otp_codes')

    # ── Supprimer les colonnes ajoutées à users ───────────────────────────────
    op.execute("DROP INDEX IF EXISTS ix_users_google_id")
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'google_id')
    op.drop_column('users', 'auth_provider')
    op.drop_column('users', 'email_verified_at')
    op.drop_column('users', 'is_email_verified')

    # Remettre mot_de_passe NOT NULL
    op.alter_column('users', 'mot_de_passe', nullable=False)

    # ── Supprimer les types ENUM ──────────────────────────────────────────────
    op.execute("DROP TYPE IF EXISTS otptype")
    op.execute("DROP TYPE IF EXISTS authprovider")
