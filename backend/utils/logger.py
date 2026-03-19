import os
import sys
import locale
from datetime import datetime

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
LOG_FILE = os.path.join(LOG_DIR, "app.log")

# Create logs directory if not exists
os.makedirs(LOG_DIR, exist_ok=True)


def log(message, level="INFO"):
    """Log message to both console and file"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_message = f"[{timestamp}] [{level}] {message}"

    # Print to console
    try:
        console_encoding = sys.stdout.encoding or locale.getpreferredencoding(False) or "utf-8"
        safe_console_message = formatted_message.encode(console_encoding, errors="replace").decode(console_encoding, errors="replace")
        print(safe_console_message)
    except Exception:
        # Last-resort fallback: never crash app because of logging output.
        print(formatted_message.encode("ascii", errors="replace").decode("ascii"))

    # Write to file
    try:
        with open(LOG_FILE, "a", encoding="utf-8", errors="replace") as f:
            f.write(formatted_message + "\n")
    except Exception as e:
        print(f"Error writing to log file: {e}")


def log_error(message):
    """Log error message"""
    log(message, "ERROR")


def log_warning(message):
    """Log warning message"""
    log(message, "WARNING")


def log_info(message):
    """Log info message"""
    log(message, "INFO")


def log_success(message):
    """Log success message"""
    log(message, "SUCCESS")
