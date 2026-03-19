"""
Email Handler for Locaa AI
"""
import os
import secrets
from datetime import datetime, timedelta
from flask_mail import Mail, Message
from database.models import db, User, EmailVerificationToken
from utils.logger import log

mail = Mail()


def init_mail(app):
    """Initialize email configuration"""
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@locaaai.com')
    mail.init_app(app)


def generate_verification_token(user_id, token_type='email_verification', expires_in_hours=24):
    """Generate email verification token"""
    try:
        token = secrets.token_urlsafe(32)
        
        # Delete existing tokens
        EmailVerificationToken.query.filter_by(
            user_id=user_id,
            token_type=token_type,
            is_used=False
        ).delete()
        
        verification_token = EmailVerificationToken(
            user_id=user_id,
            token=token,
            token_type=token_type,
            expires_at=datetime.utcnow() + timedelta(hours=expires_in_hours)
        )
        
        db.session.add(verification_token)
        db.session.commit()
        
        return token
    except Exception as e:
        log(f"Token generation failed: {str(e)}", level='error')
        return None


def verify_email_token(token):
    """Verify email token and mark user as verified"""
    try:
        verification_token = EmailVerificationToken.query.filter_by(
            token=token,
            is_used=False
        ).first()
        
        if not verification_token:
            return False, "Token not found or already used"
        
        if verification_token.expires_at < datetime.utcnow():
            return False, "Token has expired"
        
        user = User.query.get(verification_token.user_id)
        if not user:
            return False, "User not found"
        
        user.is_email_verified = True
        verification_token.is_used = True
        verification_token.used_at = datetime.utcnow()
        
        db.session.commit()
        return True, "Email verified successfully"
    except Exception as e:
        log(f"Email verification failed: {str(e)}", level='error')
        return False, str(e)


def send_verification_email(user, frontend_url="http://localhost:5173"):
    """Send verification email to user"""
    try:
        token = generate_verification_token(user.id)
        verification_url = f"{frontend_url}/verify-email?token={token}"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to Locaa AI!</h2>
                    <p>Hi {user.first_name},</p>
                    <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
                    <p>
                        <a href="{verification_url}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Verify Email
                        </a>
                    </p>
                    <p>Or copy this link: <a href="{verification_url}">{verification_url}</a></p>
                    <p style="color: #666; font-size: 12px;">This link expires in 24 hours.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin-top: 30px;">
                    <p style="color: #999; font-size: 12px;">Locaa AI - Auto Video Clipping Platform</p>
                </div>
            </body>
        </html>
        """
        
        msg = Message(
            subject='Verify Your Locaa AI Account',
            recipients=[user.email],
            html=html_body
        )
        
        mail.send(msg)
        log(f"Verification email sent to {user.email}")
        return True
    except Exception as e:
        log(f"Failed to send verification email: {str(e)}", level='error')
        return False


def send_password_reset_email(user, frontend_url="http://localhost:5173"):
    """Send password reset email"""
    try:
        token = generate_verification_token(user.id, token_type='password_reset')
        reset_url = f"{frontend_url}/reset-password?token={token}"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>Hi {user.first_name},</p>
                    <p>Someone requested a password reset for your Locaa AI account. Click the button below to reset your password:</p>
                    <p>
                        <a href="{reset_url}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset Password
                        </a>
                    </p>
                    <p>Or copy this link: <a href="{reset_url}">{reset_url}</a></p>
                    <p style="color: #e74c3c;">This link expires in 2 hours.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin-top: 30px;">
                    <p style="color: #999; font-size: 12px;">Locaa AI - Auto Video Clipping Platform</p>
                </div>
            </body>
        </html>
        """
        
        msg = Message(
            subject='Reset Your Locaa AI Password',
            recipients=[user.email],
            html=html_body
        )
        
        mail.send(msg)
        log(f"Password reset email sent to {user.email}")
        return True
    except Exception as e:
        log(f"Failed to send password reset email: {str(e)}", level='error')
        return False


def send_otp_email(email, otp_code):
    """Send OTP verification email"""
    try:
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #667eea;">Verify Your Email</h2>
                    <p>Your verification code is:</p>
                    <div style="background-color: #f7f9fc; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #667eea; font-size: 36px; margin: 0; letter-spacing: 8px;">{otp_code}</h1>
                    </div>
                    <p>Enter this code to verify your email address.</p>
                    <p style="color: #e74c3c; font-weight: bold;">This code expires in 10 minutes.</p>
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        If you didn't request this code, please ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin-top: 30px;">
                    <p style="color: #999; font-size: 12px;">Locaa AI - Transform Long Videos into Viral Shorts</p>
                </div>
            </body>
        </html>
        """
        
        msg = Message(
            subject='Your Locaa AI Verification Code',
            recipients=[email],
            html=html_body
        )
        
        mail.send(msg)
        log(f"OTP email sent to {email}")
        return True
    except Exception as e:
        log(f"Failed to send OTP email: {str(e)}", level='error')
        return False


def send_subscription_receipt_email(user, payment, frontend_url="http://localhost:5173"):
    """Send subscription payment receipt email"""
    try:
        # Calculate amount in readable format
        amount = payment.amount
        currency = payment.currency
        plan_name = payment.plan_name
        billing_cycle = payment.billing_cycle
        
        # Format billing cycle text
        billing_text = {
            'monthly': 'Monthly',
            'quarterly': 'Quarterly (3 months)',
            'yearly': 'Yearly'
        }.get(billing_cycle, billing_cycle.capitalize())
        
        # Dashboard link
        dashboard_url = f"{frontend_url}/dashboard"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Payment Successful! 🎉</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Thank you for upgrading your Locaa AI subscription</p>
                    </div>
                    
                    <!-- Body -->
                    <div style="padding: 30px;">
                        <h2 style="color: #667eea; margin-top: 0;">Receipt Details</h2>
                        
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr style="border-bottom: 1px solid #e0e0e0;">
                                <td style="padding: 15px 0; font-weight: bold; color: #666;">Plan</td>
                                <td style="padding: 15px 0; text-align: right; color: #333;">{plan_name.upper()}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e0e0e0;">
                                <td style="padding: 15px 0; font-weight: bold; color: #666;">Billing Cycle</td>
                                <td style="padding: 15px 0; text-align: right; color: #333;">{billing_text}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e0e0e0;">
                                <td style="padding: 15px 0; font-weight: bold; color: #666;">Payment ID</td>
                                <td style="padding: 15px 0; text-align: right; color: #333; font-family: monospace; font-size: 12px;">{payment.transaction_id or payment.stripe_payment_id or payment.id}</td>
                            </tr>
                            <tr style="border-bottom: 2px solid #667eea;">
                                <td style="padding: 15px 0; font-weight: bold; color: #666; font-size: 18px;">Total Amount</td>
                                <td style="padding: 15px 0; text-align: right; color: #667eea; font-weight: bold; font-size: 24px;">{currency.upper()} {amount:.2f}</td>
                            </tr>
                        </table>
                        
                        <div style="background-color: #f7f9fc; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #555;"><strong>✨ Your subscription is now active!</strong></p>
                            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                                You now have access to all premium features. Start creating amazing AI-powered videos!
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{dashboard_url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">
                                Go to Dashboard →
                            </a>
                        </div>
                        
                        <div style="background-color: #fff9e6; border: 1px solid #ffd700; border-radius: 8px; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #856404; font-size: 14px;"><strong>📧 Need Help?</strong></p>
                            <p style="margin: 10px 0 0 0; color: #856404; font-size: 13px;">
                                Contact our support team at <a href="mailto:harshshakya908431@gmail.com" style="color: #667eea;">harshshakya908431@gmail.com</a>
                            </p>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #f7f9fc; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                        <p style="margin: 0; color: #999; font-size: 12px;">
                            Locaa AI - Transform Long Videos into Viral Shorts<br>
                            © 2026 Locaa AI. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        msg = Message(
            subject=f'Payment Receipt - {plan_name} Plan',
            recipients=[user.email],
            html=html_body
        )
        
        mail.send(msg)
        log(f"✅ Receipt email sent to {user.email} for payment {payment.id}")
        return True
    except Exception as e:
        log(f"❌ Failed to send receipt email: {str(e)}", level='error')
        return False


def send_welcome_email(user):
    """Send welcome email to verified user"""
    try:
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to Locaa AI! 🎉</h2>
                    <p>Hi {user.first_name},</p>
                    <p>Your email has been verified successfully. You're all set to start creating amazing clips!</p>
                    <h3>Get Started:</h3>
                    <ul>
                        <li>Log in to your dashboard</li>
                        <li>Paste a YouTube video URL</li>
                        <li>Let AI create the best clips automatically</li>
                        <li>Publish to YouTube & Instagram instantly</li>
                    </ul>
                    <h3>Your Plan:</h3>
                    <p><strong>{user.subscription_tier.upper()}</strong> - {user.get_plan_info()['videos_per_month']} videos/month</p>
                    <p>Need help? Check out our <a href="https://docs.locaaai.com">documentation</a></p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin-top: 30px;">
                    <p style="color: #999; font-size: 12px;">Locaa AI - Auto Video Clipping Platform</p>
                </div>
            </body>
        </html>
        """
        
        msg = Message(
            subject='Get Started with Locaa AI',
            recipients=[user.email],
            html=html_body
        )
        
        mail.send(msg)
        log(f"Welcome email sent to {user.email}")
        return True
    except Exception as e:
        log(f"Failed to send welcome email: {str(e)}", level='error')
        return False


def send_job_completion_email(user, job):
    """Send email when video processing is complete"""
    try:
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2>Your Video Processing is Complete ✅</h2>
                    <p>Hi {user.first_name},</p>
                    <p>Good news! Your video "<strong>{job.title}</strong>" has been processed successfully.</p>
                    <h3>Results:</h3>
                    <ul>
                        <li>Clips Generated: <strong>{job.clips_generated}</strong></li>
                        <li>Duration: <strong>{job.duration}s</strong></li>
                        <li>Status: <strong>Ready to Publish</strong></li>
                    </ul>
                    <p>
                        <a href="https://app.locaaai.com/dashboard" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            View in Dashboard
                        </a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin-top: 30px;">
                    <p style="color: #999; font-size: 12px;">Locaa AI - Auto Video Clipping Platform</p>
                </div>
            </body>
        </html>
        """
        
        msg = Message(
            subject=f'Your "{job.title}" Video is Ready! 🚀',
            recipients=[user.email],
            html=html_body
        )
        
        mail.send(msg)
        log(f"Job completion email sent to {user.email}")
        return True
    except Exception as e:
        log(f"Failed to send job completion email: {str(e)}", level='error')
        return False

def send_subscription_receipt_email(user, payment_record):
    """Send a receipt email for a subscription purchase."""
    try:
        amount = getattr(payment_record, 'amount', 0)
        currency = getattr(payment_record, 'currency', 'USD').upper()
        
        # Format amount (handling INR or USD)
        if currency == 'USD':
            formatted_amount = f"${amount:,.2f}"
            # Stripe amounts might be in cents if passed raw, but the DB models usually store standard decimal amounts.
            # Usually amount from `payment.amount` is already proper, assuming proper here.
        elif currency == 'INR':
            # Razorpay returns amounts in paise, so we divide by 100 if it hasn't been already
            # The confirmed payment logic usually converts it, we'll just format it
            formatted_amount = f"₹{amount:,.2f}"
        else:
            formatted_amount = f"{amount} {currency}"

        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #667eea; margin: 0;">Locaa AI</h1>
                        <p style="color: #888; margin-top: 5px;">Payment Receipt</p>
                    </div>
                
                    <h2 style="color: #2c3e50;">Thank you for your purchase! 🎉</h2>
                    <p>Hi {user.first_name},</p>
                    <p>Your subscription to Locaa AI has been successfully processed. Here are the details of your transaction:</p>
                    
                    <div style="background-color: #f7f9fc; border-left: 4px solid #667eea; padding: 15px; margin: 25px 0; border-radius: 0 4px 4px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Plan:</strong></td>
                                <td style="padding: 8px 0; text-align: right; color: #333;">{payment_record.plan_name.title()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Billing Cycle:</strong></td>
                                <td style="padding: 8px 0; text-align: right; color: #333;">{payment_record.billing_cycle.title()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
                                <td style="padding: 8px 0; text-align: right; color: #333;">{datetime.utcnow().strftime('%B %d, %Y')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666; border-top: 1px solid #ddd; padding-top: 15px;"><strong>Total Amount:</strong></td>
                                <td style="padding: 8px 0; text-align: right; color: #667eea; font-weight: bold; font-size: 18px; border-top: 1px solid #ddd; padding-top: 15px;">{formatted_amount}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="margin-top: 30px;">Your new limits are now active on your account.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://app.locaaai.com/dashboard" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Go to Dashboard
                        </a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin-top: 40px;">
                    <p style="color: #999; font-size: 12px; text-align: center;">Locaa AI • Transform Long Videos into Viral Shorts</p>
                    <p style="color: #aaa; font-size: 10px; text-align: center;">If you have any questions, reply to this email.</p>
                </div>
            </body>
        </html>
        """
        
        msg = Message(
            subject=f'Receipt for Locaa AI - {payment_record.plan_name.title()} Plan',
            recipients=[user.email],
            html=html_body
        )
        
        mail.send(msg)
        log(f"Receipt email sent to {user.email} for payment {getattr(payment_record, 'id', 'new')}")
        return True
    except Exception as e:
        log(f"Failed to send receipt email: {str(e)}", level='error')
        return False
