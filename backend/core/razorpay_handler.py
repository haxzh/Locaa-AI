"""
Razorpay Payment Handler for Locaa AI
"""
import os
import json
import uuid
import razorpay
from datetime import datetime, timedelta
from database.models import db, User, Payment, SubscriptionPlan
from utils.logger import log

# Initialize Razorpay client
razorpay_client = razorpay.Client(
    auth=(
        os.getenv('RAZORPAY_KEY_ID'),
        os.getenv('RAZORPAY_SECRET')
    )
)

# Conversion rate: 1 USD = 83 INR (approximate)
USD_TO_INR = 83


def create_razorpay_order(user, amount_usd, plan_name, billing_cycle='monthly'):
    """Create Razorpay order"""
    try:
        # Convert USD to INR
        amount_inr = int(amount_usd * USD_TO_INR * 100)  # Razorpay expects amount in paise
        
        order_data = {
            'amount': amount_inr,
            'currency': 'INR',
            'receipt': f'order_{user.id}_{int(datetime.utcnow().timestamp())}',
            'notes': {
                'user_id': str(user.id),
                'user_email': user.email,
                'plan_name': plan_name,
                'billing_cycle': billing_cycle,
                'amount_usd': str(amount_usd)
            }
        }
        
        order = razorpay_client.order.create(data=order_data)
        log(f"Razorpay order created: {order['id']} for user {user.id}", level='info')
        
        return {
            'order_id': order['id'],
            'amount_inr': amount_inr,
            'amount_usd': amount_usd,
            'currency': 'INR',
            'key_id': os.getenv('RAZORPAY_KEY_ID')
        }
    except Exception as e:
        log(f"Razorpay order creation failed: {str(e)}", level='error')
        return None


def verify_razorpay_payment(payment_id, order_id, signature):
    """Verify Razorpay payment signature"""
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        log(f"Razorpay payment verified: {payment_id}", level='info')
        return True
    except razorpay.BadRequestError as e:
        log(f"Razorpay payment verification failed: {str(e)}", level='error')
        return False


def fetch_razorpay_payment(payment_id):
    """Fetch Razorpay payment details"""
    try:
        payment = razorpay_client.payment.fetch(payment_id)
        return payment
    except Exception as e:
        log(f"Failed to fetch Razorpay payment: {str(e)}", level='error')
        return None


def confirm_payment(user, payment_id, order_id, signature, plan_name, billing_cycle='monthly'):
    """Confirm and process Razorpay payment"""
    try:
        # Verify payment signature
        if not verify_razorpay_payment(payment_id, order_id, signature):
            return None
        
        # Fetch payment details
        payment_details = fetch_razorpay_payment(payment_id)
        if not payment_details or payment_details['status'] != 'captured':
            return None
        
        # Get plan
        plan = SubscriptionPlan.query.filter_by(name=plan_name).first()
        if not plan:
            return None
        
        # Create payment record
        payment = Payment(
            user_id=user.id,
            plan_id=plan.id,
            amount=payment_details['amount'] / 100,  # Convert from paise to rupees
            currency='INR',
            status='completed',
            payment_method='razorpay',
            transaction_id=payment_id,
            order_id=order_id,
            plan_name=plan_name,
            billing_cycle=billing_cycle,
            created_at=datetime.utcnow()
        )
        
        # Calculate subscription end date
        subscription_start = datetime.utcnow()
        if billing_cycle == 'monthly':
            subscription_end = subscription_start + timedelta(days=30)
        elif billing_cycle == 'quarterly':
            subscription_end = subscription_start + timedelta(days=90)
        elif billing_cycle == 'yearly':
            subscription_end = subscription_start + timedelta(days=365)
        else:
            subscription_end = subscription_start + timedelta(days=30)
        
        # Update user subscription
        user.subscription_tier = plan_name
        user.subscription_status = 'active'
        user.subscription_start_date = subscription_start
        user.subscription_end_date = subscription_end
        user.billing_cycle = billing_cycle
        
        db.session.add(payment)
        db.session.commit()
        
        log(f"Payment confirmed for user {user.id}: {payment_id}", level='info')
        return payment
    except Exception as e:
        log(f"Payment confirmation failed: {str(e)}", level='error')
        db.session.rollback()
        return None


def process_razorpay_webhook(event_data):
    """Process Razorpay webhook events"""
    try:
        event_type = event_data.get('event')
        
        if event_type == 'payment.authorized':
            handle_payment_authorized(event_data['payload']['payment']['entity'])
        elif event_type == 'payment.failed':
            handle_payment_failed(event_data['payload']['payment']['entity'])
        elif event_type == 'payment.captured':
            handle_payment_captured(event_data['payload']['payment']['entity'])
    except Exception as e:
        log(f"Webhook processing failed: {str(e)}", level='error')


def handle_payment_authorized(payment):
    """Handle authorized payment"""
    log(f"Payment authorized: {payment['id']}", level='info')


def handle_payment_captured(payment):
    """Handle captured payment"""
    log(f"Payment captured: {payment['id']}", level='info')


def handle_payment_failed(payment):
    """Handle failed payment"""
    log(f"Payment failed: {payment['id']}", level='error')
