#!/usr/bin/env python
"""
Seed Script - Populate Subscription Plans
Adds initial pricing plans to the database
"""
from app import app, db
from database.models import SubscriptionPlan
import json

def seed_subscription_plans():
    """Seed subscription plans"""
    
    with app.app_context():
        # Check if plans already exist
        existing_plans = SubscriptionPlan.query.count()
        if existing_plans > 0:
            print(f"✅ Database already has {existing_plans} plans. Skipping seed.")
            return True
        
        plans = [
            {
                'name': 'Starter',
                'price_monthly': 9.99,  # Will be converted to INR for Razorpay
                'price_yearly': 99.99,
                'videos_per_month': 5,
                'clips_per_video': 5,
                'api_access': False,
                'priority_support': False,
                'custom_branding': False,
                'description': 'Perfect for beginners testing the waters.',
                'features': json.dumps([
                    '5 Videos / month',
                    '5 AI Clips per video',
                    'Basic branding',
                    'Email support',
                    'Standard quality'
                ]),
                'is_active': True
            },
            {
                'name': 'Pro Creator',
                'price_monthly': 19.99,
                'price_yearly': 189.99,
                'videos_per_month': 30,
                'clips_per_video': 12,
                'api_access': False,
                'priority_support': True,
                'custom_branding': True,
                'description': 'Our most popular plan for serious creators.',
                'features': json.dumps([
                    '30 Videos / month',
                    '12 AI Clips per video',
                    'Custom branding',
                    '24/7 Priority support',
                    '4K quality',
                    'Advanced analytics'
                ]),
                'is_active': True
            },
            {
                'name': 'Business',
                'price_monthly': 49.99,
                'price_yearly': 449.99,
                'videos_per_month': 100,
                'clips_per_video': 25,
                'api_access': True,
                'priority_support': True,
                'custom_branding': True,
                'description': 'Advanced tools for teams and agencies.',
                'features': json.dumps([
                    '100 Videos / month',
                    '25 AI Clips per video',
                    'Custom branding',
                    '24/7 Priority support',
                    '4K quality',
                    'Advanced analytics',
                    'API access',
                    'Team collaboration',
                    'Dedicated account manager'
                ]),
                'is_active': True
            }
        ]
        
        print("📝 Adding subscription plans...")
        try:
            for plan_data in plans:
                plan = SubscriptionPlan(**plan_data)
                db.session.add(plan)
                print(f"  ✅ Added: {plan_data['name']} (₹{plan_data['price_monthly'] * 85}/mo)")
            
            db.session.commit()
            print(f"\n🎉 Successfully seeded {len(plans)} subscription plans!")
            return True
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error seeding plans: {str(e)}")
            return False

if __name__ == '__main__':
    print("=" * 60)
    print("SUBSCRIPTION PLANS SEEDING SCRIPT")
    print("=" * 60)
    print("\n📝 This script will add initial pricing plans to the database")
    print("   Plans: Starter, Pro Creator, Business\n")
    
    if seed_subscription_plans():
        print("\n✅ Seed complete! Refresh your pricing page.")
    else:
        print("\n❌ Seeding failed!")
