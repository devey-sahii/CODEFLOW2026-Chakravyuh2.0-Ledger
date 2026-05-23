"""
Notification model for the Smart Expense Auditor platform.

Stores in-app notifications for fraud alerts, expense approvals/rejections,
and general system messages.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ─── Notification Type Enum ───────────────────────────────────────────────────


class NotificationType(str, enum.Enum):
    """Enum representing the category / trigger of a notification."""

    FRAUD_ALERT = "FRAUD_ALERT"
    EXPENSE_APPROVED = "EXPENSE_APPROVED"
    EXPENSE_REJECTED = "EXPENSE_REJECTED"
    SYSTEM = "SYSTEM"
    GST_ALERT = "GST_ALERT"
    RISK_ALERT = "RISK_ALERT"
    REMINDER = "REMINDER"


# ─── Notification Model ───────────────────────────────────────────────────────


class Notification(Base):
    """
    Represents an in-app notification sent to a user.

    Attributes
    ----------
    id : UUID
        Primary key.
    user_id : UUID
        Foreign key referencing the target user.
    organization_id : UUID
        Foreign key referencing the user's organization.
    type : NotificationType
        Category of the notification.
    title : str
        Short title / headline of the notification.
    message : str
        Full notification body text.
    is_read : bool
        Whether the user has read/dismissed the notification.
    metadata : dict
        Arbitrary structured data associated with the notification
        (e.g. receipt_id, fraud_score).
    created_at : datetime
        UTC timestamp of when the notification was created.
    """

    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # ── Ownership ────────────────────────────────────────────────────────────
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Content ──────────────────────────────────────────────────────────────
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type_enum"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # ── State ────────────────────────────────────────────────────────────────
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Extra data ───────────────────────────────────────────────────────────
    metadata: Mapped[dict[str, Any] | None] = mapped_column(
        JSON, nullable=True, default=None
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ── Relationships (lazy="raise" avoids N+1; use explicit joins) ──────────
    # user = relationship("User", back_populates="notifications", lazy="raise")
    # organization = relationship("Organization", lazy="raise")

    def __repr__(self) -> str:
        return (
            f"<Notification id={self.id} type={self.type} "
            f"user_id={self.user_id} is_read={self.is_read}>"
        )

    def to_dict(self) -> dict[str, Any]:
        """Serialize to plain dict (JSON-serializable)."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "organization_id": str(self.organization_id),
            "type": self.type.value,
            "title": self.title,
            "message": self.message,
            "is_read": self.is_read,
            "metadata": self.metadata or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
