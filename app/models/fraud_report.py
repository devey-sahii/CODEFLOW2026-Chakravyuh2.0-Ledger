import enum
from app.models.audit_log import FraudReport, FraudReportStatus as FraudStatus

# FraudType is stored as a JSON array in the database, but we define the enum here for router validation/checks.
class FraudType(str, enum.Enum):
    DUPLICATE_RECEIPT = "DUPLICATE_RECEIPT"
    INFLATED_AMOUNT = "INFLATED_AMOUNT"
    PERSONAL_EXPENSE = "PERSONAL_EXPENSE"
    ROUND_AMOUNT = "ROUND_AMOUNT"
    MISSING_RECEIPT = "MISSING_RECEIPT"
    DUPLICATE_VENDOR = "DUPLICATE_VENDOR"
    UNUSUAL_TIMING = "UNUSUAL_TIMING"
    TEMPORAL_ANOMALY = "TEMPORAL_ANOMALY"

# Re-export
FraudReport = FraudReport
FraudStatus = FraudStatus
FraudType = FraudType
