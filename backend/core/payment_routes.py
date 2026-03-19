"""
Payment and Billing Routes for Locaa AI
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from database.models import db, User, Payment, SubscriptionPlan
from utils.auth import get_current_user, user_required
from core.stripe_handler import (
    create_payment_intent, create_subscription, cancel_subscription,
    get_customer_invoices, process_payment_webhook
)
from core.razorpay_handler import (
    create_razorpay_order, verify_razorpay_payment, confirm_payment as razorpay_confirm_payment
)
from core.email_handler import send_subscription_receipt_email
from utils.logger import log
from utils.notifications import create_notification

payment_bp = Blueprint('payments', __name__, url_prefix='/api/payments')


@payment_bp.route('/plans', methods=['GET'])
def get_plans():
    """Get all subscription plans"""
    try:
        plans = SubscriptionPlan.query.filter_by(is_active=True).all()
        
        return jsonify([{
            'id': plan.id,
            'name': plan.name,
            'price_monthly': plan.price_monthly,
            'price_yearly': plan.price_yearly,
            'videos_per_month': plan.videos_per_month,
            'clips_per_video': plan.clips_per_video,
            'api_access': plan.api_access,
            'priority_support': plan.priority_support,
            'custom_branding': plan.custom_branding,
            'description': plan.description,
            'features': plan.features.split(',') if plan.features else []
        } for plan in plans]), 200
    except Exception as e:
        log(f"Error fetching plans: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@payment_bp.route('/create-intent', methods=['POST'])
@user_required
def create_payment_intent_route():
    """Create Stripe payment intent"""
    try:
        data = request.get_json()
        plan_name = data.get('plan_name')  # free, pro, business
        billing_cycle = data.get('billing_cycle', 'monthly')  # monthly, yearly
        
        # Get plan
        plan = SubscriptionPlan.query.filter_by(name=plan_name).first()
        if not plan:
            return jsonify({"error": "Plan not found"}), 404
        
        # Get amount
        amount = plan.price_monthly if billing_cycle == 'monthly' else plan.price_yearly
        if not amount or amount == 0:
            return jsonify({"error": "Cannot purchase free plan"}), 400
        
        user = get_current_user()
        
        # Create payment intent
        intent = create_payment_intent(user, amount, plan_name, billing_cycle)
        if not intent:
            return jsonify({"error": "Failed to create payment intent"}), 500
        
        return jsonify({
            'client_secret': intent.client_secret,
            'payment_intent_id': intent.id,
            'amount': intent.amount / 100,
            'currency': intent.currency
        }), 200
    except Exception as e:
        log(f"Error creating payment intent: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@payment_bp.route('/confirm-payment', methods=['POST'])
@user_required
def confirm_payment():
    """Confirm payment and activate subscription"""
    try:
        data = request.get_json()
        payment_intent_id = data.get('payment_intent_id')
        plan_name = data.get('plan_name')
        billing_cycle = data.get('billing_cycle', 'monthly')
        
        user = get_current_user()
        
        # Get plan
        plan = SubscriptionPlan.query.filter_by(name=plan_name).first()
        if not plan:
            return jsonify({"error": "Plan not found"}), 404
        
        # Create payment record
        payment = Payment(
            user_id=user.id,
            stripe_payment_id=payment_intent_id,
            stripe_customer_id=user.stripe_customer_id if hasattr(user, 'stripe_customer_id') else None,
            amount=plan.price_monthly if billing_cycle == 'monthly' else plan.price_yearly,
            currency='USD',
            status='succeeded',
            plan_name=plan_name,
            billing_cycle=billing_cycle,
            paid_at=datetime.utcnow()
        )
        
        # Update user subscription
        user.subscription_tier = plan_name
        user.subscription_status = 'active'
        user.subscription_start_date = datetime.utcnow()
        
        from datetime import timedelta
        if billing_cycle == 'monthly':
            user.subscription_end_date = datetime.utcnow() + timedelta(days=30)
        else:
            user.subscription_end_date = datetime.utcnow() + timedelta(days=365)
        
        db.session.add(payment)
        db.session.commit()

        create_notification(
            user_id=user.id,
            notif_type='success',
            source='payment',
            title='Plan Upgraded',
            message=f"Payment successful. You are now on {plan_name} ({billing_cycle}).",
            meta={'plan': plan_name, 'billing_cycle': billing_cycle, 'payment_id': payment.id}
        )
        
        log(f"Payment confirmed for user {user.id}: {plan_name}")
        
        # Send Receipt Email
        # We run this synchronously right now, but in a large app it might be better
        # dispatched via Celery / Redis Queue.
        send_subscription_receipt_email(user, payment)
        
        return jsonify({
            'success': True,
            'message': f'Upgraded to {plan_name} plan',
            'subscription_tier': user.subscription_tier,
            'subscription_end_date': user.subscription_end_date.isoformat()
        }), 200
    except Exception as e:
        try:
            user = get_current_user()
            if user:
                create_notification(
                    user_id=user.id,
                    notif_type='error',
                    source='payment',
                    title='Payment Failed',
                    message=f"We could not confirm your payment. {str(e)[:140]}",
                    meta={'stage': 'confirm-payment'}
                )
        except Exception:
            pass
        log(f"Error confirming payment: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@payment_bp.route('/history', methods=['GET'])
@user_required
def get_payment_history():
    """Get user payment history"""
    try:
        user = get_current_user()
        
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        
        payments = Payment.query.filter_by(user_id=user.id).order_by(
            Payment.created_at.desc()
        ).paginate(page=page, per_page=limit)
        
        return jsonify({
            'total': payments.total,
            'pages': payments.pages,
            'current_page': page,
            'payments': [{
                'id': p.id,
                'stripe_payment_id': p.stripe_payment_id,
                'amount': p.amount,
                'currency': p.currency,
                'status': p.status,
                'plan_name': p.plan_name,
                'billing_cycle': p.billing_cycle,
                'paid_at': p.paid_at.isoformat() if p.paid_at else None,
                'created_at': p.created_at.isoformat()
            } for p in payments.items]
        }), 200
    except Exception as e:
        log(f"Error fetching payment history: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@payment_bp.route('/cancel-subscription', methods=['POST'])
@user_required
def cancel_user_subscription():
    """Cancel user subscription"""
    try:
        user = get_current_user()
        
        if not hasattr(user, 'stripe_subscription_id') or not user.stripe_subscription_id:
            return jsonify({"error": "No active subscription"}), 400
        
        # Cancel subscription in Stripe
        result = cancel_subscription(user.stripe_subscription_id)
        if not result:
            return jsonify({"error": "Failed to cancel subscription"}), 500
        
        # Update user
        user.subscription_tier = 'free'
        user.subscription_status = 'cancelled'
        user.subscription_end_date = datetime.utcnow()
        db.session.commit()

        create_notification(
            user_id=user.id,
            notif_type='warning',
            source='payment',
            title='Subscription Cancelled',
            message='Your subscription has been cancelled and your plan is now Free.',
            meta={'subscription_tier': 'free'}
        )
        
        log(f"Subscription cancelled for user {user.id}")
        
        return jsonify({
            'success': True,
            'message': 'Subscription cancelled',
            'subscription_tier': 'free',
            'effective_date': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        log(f"Error cancelling subscription: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@payment_bp.route('/invoice/<int:payment_id>', methods=['GET'])
@user_required
def get_invoice(payment_id):
    """Get invoice details"""
    try:
        user = get_current_user()
        payment = Payment.query.filter_by(id=payment_id, user_id=user.id).first()
        
        if not payment:
            return jsonify({"error": "Invoice not found"}), 404
        
        return jsonify({
            'id': payment.id,
            'stripe_payment_id': payment.stripe_payment_id,
            'amount': payment.amount,
            'currency': payment.currency,
            'status': payment.status,
            'plan_name': payment.plan_name,
            'billing_cycle': payment.billing_cycle,
            'paid_at': payment.paid_at.isoformat() if payment.paid_at else None,
            'created_at': payment.created_at.isoformat(),
            'description': f'{payment.plan_name.upper()} Plan - {payment.billing_cycle}'
        }), 200
    except Exception as e:
        log(f"Error fetching invoice: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@payment_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Stripe webhook handler"""
    try:
        from core.stripe_handler import STRIPE_WEBHOOK_SECRET
        import stripe
        
        event = request.get_json()
        
        # Verify webhook signature
        sig_header = request.headers.get('Stripe-Signature')
        
        try:
            event = stripe.Webhook.construct_event(
                request.data,
                sig_header,
                STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return jsonify({"error": "Invalid payload"}), 400
        except stripe.error.SignatureVerificationError:
            return jsonify({"error": "Invalid signature"}), 400
        
        # Process webhook
        process_payment_webhook(event)
        
        return jsonify({'success': True}), 200
    except Exception as e:
        log(f"Error processing webhook: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


# ==================== RAZORPAY PAYMENT ROUTES ====================

@payment_bp.route('/razorpay/create-order', methods=['POST'])
@user_required
def create_razorpay_order_route():
    """Create Razorpay order for payment"""
    try:
        data = request.get_json()
        plan_id = data.get('plan_id')  # Plan ID (starter, pro, business)
        billing_cycle = data.get('billing_cycle', 'monthly')  # monthly, quarterly, yearly
        
        user = get_current_user()
        
        # Get plan from database (handle both integer IDs and string slugs)
        try:
            # Try to lookup by integer database ID
            plan = SubscriptionPlan.query.get(int(plan_id))
            if plan:
                plan_name = plan.name
            else:
                plan_name = None
        except (ValueError, TypeError):
            # Fallback to string mapping if it's not an integer
            plan_name_map = {
                'starter': 'Starter',
                'pro': 'Pro Creator',
                'business': 'Business'
            }
            plan_name = plan_name_map.get(str(plan_id).lower())
            plan = SubscriptionPlan.query.filter_by(name=plan_name).first() if plan_name else None
            
        if not plan or not plan_name:
            return jsonify({"error": "Plan not found"}), 404
        
        # Get amount based on billing cycle
        if billing_cycle == 'monthly':
            amount_usd = plan.price_monthly
        elif billing_cycle == 'quarterly':
            # For 3-month billing, calculate based on monthly * 3 with discount
            amount_usd = (plan.price_monthly * 3) - 8  # $8 savings as shown in UI
        elif billing_cycle == 'yearly':
            amount_usd = plan.price_yearly
        else:
            amount_usd = plan.price_monthly
        
        if not amount_usd or amount_usd == 0:
            return jsonify({"error": "Cannot purchase free plan"}), 400
        
        # Create Razorpay order
        order = create_razorpay_order(user, amount_usd, plan_name, billing_cycle)
        if not order:
            return jsonify({"error": "Failed to create payment order"}), 500
        
        log(f"Razorpay order created for user {user.id}: {order['order_id']}")
        
        return jsonify({
            'success': True,
            'order_id': order['order_id'],
            'amount': order['amount_inr'],
            'currency': 'INR',
            'key_id': order['key_id'],
            'user_email': user.email,
            'user_name': f"{user.first_name} {user.last_name}",
            'description': f"{plan_name} - {billing_cycle}",
            'plan_id': plan_id,
            'billing_cycle': billing_cycle
        }), 200
    except Exception as e:
        log(f"Error creating Razorpay order: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@payment_bp.route('/razorpay/verify-payment', methods=['POST'])
@user_required
def verify_razorpay_payment_route():
    """Verify Razorpay payment and activate subscription"""
    try:
        data = request.get_json()
        payment_id = data.get('razorpay_payment_id')
        order_id = data.get('razorpay_order_id')
        signature = data.get('razorpay_signature')
        plan_id = data.get('plan_id')
        billing_cycle = data.get('billing_cycle', 'monthly')
        
        user = get_current_user()
        
        if not all([payment_id, order_id, signature]):
            return jsonify({"error": "Missing payment verification details"}), 400
        
        # Map plan ID to plan name
        try:
            plan = SubscriptionPlan.query.get(int(plan_id))
            if plan:
                plan_name = plan.name
            else:
                plan_name = None
        except (ValueError, TypeError):
            plan_name_map = {
                'starter': 'Starter',
                'pro': 'Pro Creator',
                'business': 'Business'
            }
            plan_name = plan_name_map.get(str(plan_id).lower())
            
        if not plan_name:
            # Maybe the plan name was passed as ID fallback
            plan_name = str(plan_id) if str(plan_id) in ['Starter', 'Pro Creator', 'Business'] else None
            
        if not plan_name:
            return jsonify({"error": "Invalid plan ID"}), 400
        
        # Confirm payment in database
        payment = razorpay_confirm_payment(user, payment_id, order_id, signature, plan_name, billing_cycle)
        
        if not payment:
            return jsonify({"error": "Payment verification failed"}), 400
        
        log(f"Payment verified for user {user.id}: {payment_id}")

        create_notification(
            user_id=user.id,
            notif_type='success',
            source='payment',
            title='Payment Successful',
            message=f"Your {plan_name} plan is active now.",
            meta={'plan': plan_name, 'billing_cycle': billing_cycle, 'payment_id': payment_id}
        )
        
        # Send Receipt Email
        send_subscription_receipt_email(user, payment)
        
        return jsonify({
            'success': True,
            'message': f'Successfully upgraded to {plan_name} plan',
            'payment_id': payment_id,
            'subscription_tier': user.subscription_tier,
            'subscription_end_date': user.subscription_end_date.isoformat() if user.subscription_end_date else None,
            'billing_cycle': billing_cycle
        }), 200
    except Exception as e:
        try:
            user = get_current_user()
            if user:
                create_notification(
                    user_id=user.id,
                    notif_type='error',
                    source='payment',
                    title='Razorpay Verification Failed',
                    message=f"Payment verification failed. {str(e)[:140]}",
                    meta={'stage': 'razorpay-verify'}
                )
        except Exception:
            pass
        log(f"Error verifying Razorpay payment: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@payment_bp.route('/razorpay/webhook', methods=['POST'])
def razorpay_webhook():
    """Razorpay webhook handler"""
    try:
        from core.razorpay_handler import process_razorpay_webhook
        
        event_data = request.get_json()
        
        # Process webhook
        process_razorpay_webhook(event_data)
        
        return jsonify({'success': True}), 200
    except Exception as e:
        log(f"Error processing Razorpay webhook: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500
