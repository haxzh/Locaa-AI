"""
Stripe Payment Handler for Locaa AI
"""
import os
import json
from datetime import datetime, timedelta
import stripe
from database.models import db, User, Payment, SubscriptionPlan
from utils.logger import log

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')


def create_stripe_customer(user):
    """Create Stripe customer for user"""
    try:
        customer = stripe.Customer.create(
            email=user.email,
            name=f"{user.first_name} {user.last_name}",
            metadata={"user_id": user.id}
        )
        return customer.id
    except stripe.error.StripeError as e:
        log(f"Stripe customer creation failed: {str(e)}", level='error')
        return None


def create_payment_intent(user, amount, plan_name, billing_cycle='monthly'):
    """Create Stripe payment intent"""
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Convert to cents
            currency="usd",
            customer=user.stripe_customer_id if hasattr(user, 'stripe_customer_id') else None,
            metadata={
                'user_id': user.id,
                'plan_name': plan_name,
                'billing_cycle': billing_cycle
            }
        )
        return intent
    except stripe.error.StripeError as e:
        log(f"Payment intent creation failed: {str(e)}", level='error')
        return None


def create_subscription(user, plan_id, billing_cycle='monthly'):
    """Create Stripe subscription for user"""
    try:
        if not user.stripe_customer_id:
            user.stripe_customer_id = create_stripe_customer(user)
            db.session.commit()
        
        subscription = stripe.Subscription.create(
            customer=user.stripe_customer_id,
            items=[{"price": plan_id}],
            metadata={"user_id": user.id, "billing_cycle": billing_cycle}
        )
        
        return subscription
    except stripe.error.StripeError as e:
        log(f"Subscription creation failed: {str(e)}", level='error')
        return None


def cancel_subscription(subscription_id):
    """Cancel Stripe subscription"""
    try:
        subscription = stripe.Subscription.delete(subscription_id)
        return subscription
    except stripe.error.StripeError as e:
        log(f"Subscription cancellation failed: {str(e)}", level='error')
        return None


def process_payment_webhook(event_data):
    """Process Stripe webhook events"""
    event_type = event_data['type']
    
    if event_type == 'payment_intent.succeeded':
        handle_payment_succeeded(event_data['data']['object'])
    elif event_type == 'payment_intent.payment_failed':
        handle_payment_failed(event_data['data']['object'])
    elif event_type == 'customer.subscription.updated':
        handle_subscription_updated(event_data['data']['object'])
    elif event_type == 'customer.subscription.deleted':
        handle_subscription_deleted(event_data['data']['object'])


def handle_payment_succeeded(payment_intent):
    """Handle successful payment"""
    user_id = payment_intent['metadata'].get('user_id')
    plan_name = payment_intent['metadata'].get('plan_name')
    billing_cycle = payment_intent['metadata'].get('billing_cycle', 'monthly')
    
    user = User.query.get(user_id)
    if not user:
        return
    
    # Create payment record
    payment = Payment(
        user_id=user_id,
        stripe_payment_id=payment_intent['id'],
        amount=payment_intent['amount'] / 100,
        currency=payment_intent['currency'],
        status='succeeded',
        plan_name=plan_name,
        billing_cycle=billing_cycle,
        paid_at=datetime.utcnow()
    )
    
    # Update user subscription
    user.subscription_tier = plan_name
    user.subscription_status = 'active'
    user.subscription_start_date = datetime.utcnow()
    if billing_cycle == 'monthly':
        user.subscription_end_date = datetime.utcnow() + timedelta(days=30)
    else:
        user.subscription_end_date = datetime.utcnow() + timedelta(days=365)
    
    db.session.add(payment)
    db.session.commit()
    
    log(f"Payment succeeded for user {user_id}: {plan_name}")


def handle_payment_failed(payment_intent):
    """Handle failed payment"""
    user_id = payment_intent['metadata'].get('user_id')
    
    payment = Payment(
        user_id=user_id,
        stripe_payment_id=payment_intent['id'],
        amount=payment_intent['amount'] / 100,
        currency=payment_intent['currency'],
        status='failed',
        failed_at=datetime.utcnow()
    )
    
    db.session.add(payment)
    db.session.commit()
    
    log(f"Payment failed for user {user_id}")


def handle_subscription_updated(subscription):
    """Handle subscription update"""
    user_id = subscription['metadata'].get('user_id')
    user = User.query.get(user_id)
    
    if user:
        user.subscription_status = 'active'
        user.updated_at = datetime.utcnow()
        db.session.commit()
        log(f"Subscription updated for user {user_id}")


def handle_subscription_deleted(subscription):
    """Handle subscription deletion"""
    user_id = subscription['metadata'].get('user_id')
    user = User.query.get(user_id)
    
    if user:
        user.subscription_tier = 'free'
        user.subscription_status = 'cancelled'
        user.subscription_end_date = datetime.utcnow()
        db.session.commit()
        log(f"Subscription cancelled for user {user_id}")


def get_customer_invoices(stripe_customer_id, limit=10):
    """Get customer invoices from Stripe"""
    try:
        invoices = stripe.Invoice.list(customer=stripe_customer_id, limit=limit)
        return invoices
    except stripe.error.StripeError as e:
        log(f"Failed to fetch invoices: {str(e)}", level='error')
        return None
