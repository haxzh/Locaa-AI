// import React, { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'
// import { FaCheck, FaTimes, FaSpinner, FaRocket, FaStar } from 'react-icons/fa'
// import { motion } from 'framer-motion'

// const PricingPlans = () => {
//     const [plans, setPlans] = useState([])
//     const [loading, setLoading] = useState(true)
//     const [error, setError] = useState(null)
//     const [processingPlan, setProcessingPlan] = useState(null)
//     const [billingCycle, setBillingCycle] = useState('monthly')
//     const { token } = useAuth()
//     const navigate = useNavigate()

//     const BILLING_PRICES = {
//         monthly: 19,
//         quarterly: 49,
//         yearly: 189
//     }

//     const FALLBACK_PLANS = [
//         {
//             id: 'creator',
//             name: 'Creator',
//             description: 'Best for solo creators and consistent uploads.',
//             videos_per_month: 30,
//             clips_per_video: 12,
//             custom_branding: true,
//             priority_support: true,
//             api_access: true
//         }
//     ]

//     useEffect(() => {
//         const fetchPlans = async () => {
//             try {
//                 const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plans`)
//                 if (!res.ok) throw new Error('Failed to fetch pricing plans')
//                 const data = await res.json()
//                 setPlans(Array.isArray(data) && data.length > 0 ? data : FALLBACK_PLANS)
//             } catch (err) {
//                 setPlans(FALLBACK_PLANS)
//                 setError('Live plans unavailable. Showing default pricing.')
//             } finally {
//                 setLoading(false)
//             }
//         }
//         fetchPlans()
//     }, [])

//     const handleSubscribe = async (planId) => {
//         setProcessingPlan(planId)
//         try {
//             const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/create-checkout-session`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 },
//                 body: JSON.stringify({ plan_id: planId, billing_cycle: billingCycle })
//             })

//             const data = await res.json()
//             if (!res.ok) throw new Error(data.error || 'Checkout failed')

//             if (data.checkout_url) {
//                 window.location.href = data.checkout_url
//             }
//         } catch (err) {
//             setError(err.message)
//             setProcessingPlan(null)
//         }
//     }

//     const containerVariants = {
//         hidden: { opacity: 0 },
//         visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
//     }

//     const cardVariants = {
//         hidden: { y: 30, opacity: 0 },
//         visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } }
//     }

//     if (loading) return (
//         <div className="min-h-screen flex items-center justify-center bg-dark-900">
//             <FaSpinner className="animate-spin text-5xl text-primary-500" />
//         </div>
//     )

//     return (
//         <div className="min-h-screen py-20 px-6 relative overflow-hidden bg-dark-900 text-dark-50 font-sans">
//             {/* Ambient Background Elements */}
//             <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none" />
//             <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none" />

//             <motion.div
//                 initial="hidden"
//                 animate="visible"
//                 variants={containerVariants}
//                 className="max-w-6xl mx-auto relative z-10"
//             >
//                 <div className="text-center mb-16">
//                     <motion.div variants={cardVariants} className="inline-block mb-4 px-4 py-1.5 bg-primary-500/10 text-primary-400 rounded-full font-bold text-sm tracking-widest uppercase border border-primary-500/20">
//                         Pricing
//                     </motion.div>
//                     <motion.h1 variants={cardVariants} className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 text-white">
//                         Simple, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-blue-400">transparent pricing</span>
//                     </motion.h1>
//                     <motion.p variants={cardVariants} className="text-dark-300 text-lg md:text-xl max-w-2xl mx-auto mb-10">
//                         No hidden fees. No surprise charges. Choose the plan that best fits your content creation needs.
//                     </motion.p>

//                     {/* Billing Toggle */}
//                     <motion.div variants={cardVariants} className="flex items-center justify-center gap-3 flex-wrap">
//                         <button
//                             onClick={() => setBillingCycle('monthly')}
//                             className={`px-4 py-2 rounded-full border transition-all duration-300 ${billingCycle === 'monthly' ? 'bg-primary-500 text-white border-primary-400 shadow-lg shadow-primary-500/30' : 'bg-dark-700 text-dark-300 border-white/10'}`}
//                         >
//                             1 Month - $19
//                         </button>
//                         <button
//                             onClick={() => setBillingCycle('quarterly')}
//                             className={`px-4 py-2 rounded-full border transition-all duration-300 ${billingCycle === 'quarterly' ? 'bg-primary-500 text-white border-primary-400 shadow-lg shadow-primary-500/30' : 'bg-dark-700 text-dark-300 border-white/10'}`}
//                         >
//                             3 Months - $49
//                         </button>
//                         <button
//                             onClick={() => setBillingCycle('yearly')}
//                             className={`px-4 py-2 rounded-full border transition-all duration-300 ${billingCycle === 'yearly' ? 'bg-primary-500 text-white border-primary-400 shadow-lg shadow-primary-500/30' : 'bg-dark-700 text-dark-300 border-white/10'}`}
//                         >
//                             1 Year - $189
//                         </button>
//                         <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-bold border border-green-500/30">Best Value: 3 Months saves $8</span>
//                     </motion.div>
//                 </div>

//                 {error && (
//                     <div className="max-w-2xl mx-auto bg-red-500/10 text-red-400 p-4 rounded-xl text-center mb-8 border border-red-500/20 flex items-center justify-center gap-2">
//                         <span>⚠️</span> {error}
//                     </div>
//                 )}

//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center max-w-7xl mx-auto">
//                     {plans.map((plan, index) => {
//                         const isPopular = plan.name.toLowerCase().includes('pro') || index === 1
//                         const price = BILLING_PRICES[billingCycle]
//                         const billingLabel = billingCycle === 'monthly' ? '/mo' : billingCycle === 'quarterly' ? '/3mo' : '/yr'

//                         return (
//                             <motion.div
//                                 key={plan.id}
//                                 variants={cardVariants}
//                                 className={`relative p-8 md:p-10 rounded-3xl transition-transform duration-300 ${isPopular
//                                         ? 'bg-gradient-to-b from-dark-800 to-dark-900 border-2 border-primary-500 shadow-2xl shadow-primary-500/20 z-10 scale-100 md:scale-105'
//                                         : 'glass-panel bg-dark-800/40 border-white/5 shadow-xl scale-100'
//                                     }`}
//                             >
//                                 {isPopular && (
//                                     <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider flex items-center gap-2 shadow-lg shadow-primary-500/30">
//                                         <FaStar /> MOST POPULAR
//                                     </div>
//                                 )}

//                                 <div className="text-center mb-8">
//                                     <h3 className={`text-2xl font-display font-bold mb-2 ${isPopular ? 'text-white' : 'text-dark-50'}`}>{plan.name}</h3>
//                                     <p className="text-dark-400 text-sm h-12 flex items-center justify-center">{plan.description}</p>

//                                     <div className="mt-6 flex items-start justify-center">
//                                         <span className="text-xl text-dark-400 mt-2">$</span>
//                                         <motion.span
//                                             key={`${plan.id}-${billingCycle}`}
//                                             initial={{ opacity: 0, y: 10, scale: 0.95 }}
//                                             animate={{ opacity: 1, y: 0, scale: 1 }}
//                                             transition={{ duration: 0.35, ease: 'easeOut' }}
//                                             className={`text-6xl font-bold font-display ${isPopular ? 'text-white' : 'text-dark-50'}`}
//                                         >
//                                             {price}
//                                         </motion.span>
//                                         <span className="text-dark-400 self-end mb-2 ml-1">{billingLabel}</span>
//                                     </div>

//                                     <div className="h-6 mt-2">
//                                         {billingCycle === 'monthly' && <span className="text-sm text-dark-400 font-medium">Billed monthly</span>}
//                                         {billingCycle === 'quarterly' && <span className="text-sm text-green-400 font-medium">Billed $49 every 3 months</span>}
//                                         {billingCycle === 'yearly' && <span className="text-sm text-green-400 font-medium">Billed $189 annually</span>}
//                                     </div>
//                                 </div>

//                                 <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>

//                                 <ul className="space-y-4 mb-10 text-dark-100 flex-1">
//                                     <li className="flex items-center gap-4">
//                                         <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
//                                             <FaCheck className="text-green-400 text-xs" />
//                                         </div>
//                                         <span className="text-sm">{plan.videos_per_month} Videos / month</span>
//                                     </li>
//                                     <li className="flex items-center gap-4">
//                                         <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
//                                             <FaCheck className="text-green-400 text-xs" />
//                                         </div>
//                                         <span className="text-sm">Up to {plan.clips_per_video} clips / video</span>
//                                     </li>
//                                     <li className="flex items-center gap-4">
//                                         <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${plan.custom_branding ? 'bg-green-500/20' : 'bg-dark-700'}`}>
//                                             {plan.custom_branding ? <FaCheck className="text-green-400 text-xs" /> : <FaTimes className="text-dark-500 text-xs" />}
//                                         </div>
//                                         <span className={`text-sm ${plan.custom_branding ? 'text-dark-50' : 'text-dark-500'}`}>Custom Branding</span>
//                                     </li>
//                                     <li className="flex items-center gap-4">
//                                         <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${plan.priority_support ? 'bg-green-500/20' : 'bg-dark-700'}`}>
//                                             {plan.priority_support ? <FaCheck className="text-green-400 text-xs" /> : <FaTimes className="text-dark-500 text-xs" />}
//                                         </div>
//                                         <span className={`text-sm ${plan.priority_support ? 'text-dark-50' : 'text-dark-500'}`}>Priority Support</span>
//                                     </li>
//                                     <li className="flex items-center gap-4">
//                                         <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${plan.api_access ? 'bg-green-500/20' : 'bg-dark-700'}`}>
//                                             {plan.api_access ? <FaCheck className="text-green-400 text-xs" /> : <FaTimes className="text-dark-500 text-xs" />}
//                                         </div>
//                                         <span className={`text-sm ${plan.api_access ? 'text-dark-50' : 'text-dark-500'}`}>API Access</span>
//                                     </li>
//                                 </ul>

//                                 <button
//                                     className={`w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${isPopular
//                                             ? 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-lg shadow-primary-500/25'
//                                             : 'bg-dark-700 hover:bg-dark-600 text-white border border-white/5 hover:border-white/10'
//                                         }`}
//                                     onClick={() => handleSubscribe(plan.id)}
//                                     disabled={processingPlan === plan.id}
//                                 >
//                                     {processingPlan === plan.id ? (
//                                         <><FaSpinner className="animate-spin" /> Processing...</>
//                                     ) : (
//                                         isPopular ? <><FaRocket /> Start {billingCycle === 'quarterly' ? '3-Month' : billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} Plan</> : 'Choose Plan'
//                                     )}
//                                 </button>
//                             </motion.div>
//                         )
//                     })}
//                 </div>
//             </motion.div>
//         </div>
//     )
// }

// export default PricingPlans


















































import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaCheck, FaTimes, FaSpinner, FaRocket, FaStar, FaShieldAlt, FaQuestionCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const PricingPlans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingPlan, setProcessingPlan] = useState(null);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const { token, refreshAccessToken } = useAuth();
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const heroStats = [
        { value: '12K+', label: 'paying creators' },
        { value: '50K+', label: 'clips every month' },
        { value: '98%', label: 'renewal satisfaction' }
    ];
    const pricingHighlights = [
        'No hidden setup fees',
        'Razorpay secure checkout',
        'Upgrade or cancel anytime'
    ];
    const faqItems = [
        { title: 'Can I start for free?', text: 'Yes. You can explore the product with the starter tier and upgrade only when your workflow grows.' },
        { title: 'Does billing support teams?', text: 'Business plans are designed for startup teams, agencies and founder-led marketing operations.' },
        { title: 'What happens after payment?', text: 'Your subscription activates immediately and your dashboard unlocks higher limits and premium features.' }
    ];

    // Billing data for INR pricing
    const getBillingPrice = (plan) => {
        const monthly_price = parseFloat(plan.price_monthly) || 0;
        const yearly_price = parseFloat(plan.price_yearly) || 0;
        const monthly_inr = Math.round(monthly_price * 83);
        const yearly_inr = Math.round(yearly_price * 83);
        const quarterly_inr = Math.round((monthly_inr * 3) * 0.85); // 15% discount for quarterly
        
        return {
            monthly: { price: monthly_inr, label: '/mo', savings: null },
            quarterly: { price: quarterly_inr, label: '/3mo', savings: 'Save 15%' },
            yearly: { price: yearly_inr, label: '/yr', savings: 'Save 20%' }
        };
    };

    const FALLBACK_PLANS = [
        { id: 'starter', name: 'Starter', description: 'Perfect for beginners testing the waters.', videos_per_month: 5, clips_per_video: 5, custom_branding: false, priority_support: false, api_access: false, price_monthly: 9.99, price_yearly: 99.99 },
        { id: 'pro', name: 'Pro Creator', description: 'Our most popular plan for serious creators.', videos_per_month: 30, clips_per_video: 12, custom_branding: true, priority_support: true, api_access: false, price_monthly: 19.99, price_yearly: 189.99 },
        { id: 'business', name: 'Business', description: 'Advanced tools for teams and agencies.', videos_per_month: 100, clips_per_video: 25, custom_branding: true, priority_support: true, api_access: true, price_monthly: 49.99, price_yearly: 449.99 }
    ];

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/payments/plans`);
                if (!res.ok) throw new Error('Using local pricing defaults.');
                const data = await res.json();
                setPlans(Array.isArray(data) && data.length > 0 ? data : FALLBACK_PLANS);
            } catch (err) {
                setPlans(FALLBACK_PLANS);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleSubscribe = async (planId) => {
        setProcessingPlan(planId);

        let accessToken = token || localStorage.getItem('access_token');
        if (!accessToken) {
            setError('Please login first to continue payment.');
            setProcessingPlan(null);
            window.location.href = '/login';
            return;
        }

        try {
            const createOrder = async (authToken) => {
                return fetch(`${API_BASE}/api/payments/razorpay/create-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        plan_id: planId,
                        billing_cycle: billingCycle
                    })
                });
            };

            // Step 1: Create Razorpay order
            let createOrderRes = await createOrder(accessToken);

            if (createOrderRes.status === 401) {
                const refreshedToken = await refreshAccessToken();
                if (!refreshedToken) throw new Error('Session expired. Please login again.');
                accessToken = refreshedToken;
                createOrderRes = await createOrder(accessToken);
            }

            const orderData = await createOrderRes.json();
            if (createOrderRes.status === 401) throw new Error('Session expired. Please login again.');
            if (!createOrderRes.ok) throw new Error(orderData.error || 'Failed to create order');

            // Step 2: Initialize Razorpay payment
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: 'INR',
                name: 'AI Clipper',
                description: orderData.description,
                order_id: orderData.order_id,
                prefill: {
                    email: orderData.user_email,
                    name: orderData.user_name,
                },
                theme: {
                    color: '#3B82F6'
                },
                handler: async (response) => {
                    try {
                        // Step 3: Verify payment
                        const verifyRes = await fetch(`${API_BASE}/api/payments/razorpay/verify-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${accessToken}`
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                plan_id: planId,
                                billing_cycle: billingCycle
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');

                        setError(null);
                        alert('✨ Payment successful! Your subscription is now active.');
                        
                        // Redirect to dashboard after successful payment
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 2000);
                    } catch (err) {
                        setError(`Verification failed: ${err.message}`);
                        setProcessingPlan(null);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setProcessingPlan(null);
                    }
                }
            };

            // Create and open Razorpay modal
            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            setError(err.message);
            setProcessingPlan(null);
        }
    };

    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0c]">
            <FaSpinner className="animate-spin text-5xl text-blue-500 mb-4" />
            <p className="text-gray-400 animate-pulse">Loading amazing plans...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-blue-500/30 font-sans pb-20 overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-40 right-0 w-[420px] h-[420px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-grid-dots opacity-20 pointer-events-none" />
            
            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.span 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest"
                    >
                        Flexible Plans
                    </motion.span>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-extrabold mt-6 mb-6 tracking-tight"
                    >
                        Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Scale?</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                        className="text-gray-400 text-lg max-w-2xl mx-auto"
                    >
                        Join 10,000+ creators using our AI tools to automate their workflow.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.28 }}
                        className="mt-8 flex flex-wrap items-center justify-center gap-3"
                    >
                        {pricingHighlights.map((item) => (
                            <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300">
                                {item}
                            </span>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
                    >
                        {heroStats.map((stat) => (
                            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-md">
                                <p className="text-3xl font-black tracking-tight text-white">{stat.value}</p>
                                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>

                    {/* Billing Switcher */}
                    <div className="mt-12 inline-flex p-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl relative">
                        {['monthly', 'quarterly', 'yearly'].map((cycle) => {
                            const samplePlan = plans[1] || plans[0]; // Use middle/pro plan for display
                            const billingData = getBillingPrice(samplePlan);
                            const cycleData = billingData[cycle];
                            return (
                                <button
                                    key={cycle}
                                    onClick={() => setBillingCycle(cycle)}
                                    className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${billingCycle === cycle ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                >
                                    {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                                    {cycleData.savings && (
                                        <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-md">
                                            {cycleData.savings}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                        {/* Animated background slider */}
                        <motion.div 
                            className="absolute inset-y-1.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20"
                            initial={false}
                            animate={{ 
                                x: billingCycle === 'monthly' ? 6 : billingCycle === 'quarterly' ? 108 : 225,
                                width: billingCycle === 'monthly' ? 95 : billingCycle === 'quarterly' ? 110 : 90 
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                    </div>
                </div>

                {error && (
                    <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
                        ⚠️ {error}
                    </div>
                )}

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, idx) => {
                        const isPro = plan.id === 'pro' || idx === 1;
                        const billingData = getBillingPrice(plan);
                        const currentPrice = billingData[billingCycle];
                        
                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 hover:translate-y-[-8px] ${
                                    isPro 
                                    ? 'bg-gradient-to-b from-blue-600/20 to-blue-600/5 border-blue-500/50 shadow-[0_0_40px_-15px_rgba(59,130,246,0.3)]' 
                                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                                }`}
                            >
                                {isPro && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-[10px] font-black tracking-tighter flex items-center gap-1 shadow-xl">
                                        <FaStar className="text-[8px]" /> RECOMMENDED
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{plan.description}</p>
                                    {currentPrice.savings && (
                                        <div className="mt-4 inline-flex rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-green-400">
                                            {currentPrice.savings}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-8 flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold">₹</span>
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={billingCycle}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="text-6xl font-black tracking-tight"
                                        >
                                            {currentPrice.price}
                                        </motion.span>
                                    </AnimatePresence>
                                    <span className="text-gray-500 font-medium">{currentPrice.label}</span>
                                </div>

                                <div className="space-y-4 mb-10 flex-grow">
                                    <FeatureItem label={`${plan.videos_per_month} Videos / month`} active />
                                    <FeatureItem label={`${plan.clips_per_video} AI Clips per video`} active />
                                    <FeatureItem label="Custom Branding" active={plan.custom_branding} />
                                    <FeatureItem label="24/7 Priority Support" active={plan.priority_support} />
                                    <FeatureItem label="API Developer Access" active={plan.api_access} />
                                </div>

                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={processingPlan === plan.id}
                                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                                        isPro 
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30' 
                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                    }`}
                                >
                                    {processingPlan === plan.id ? <FaSpinner className="animate-spin" /> : <><FaRocket className="text-sm" /> Get Started</>}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer Badges */}
                <div className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all">
                    <div className="flex items-center gap-2 font-semibold"><FaShieldAlt /> Secure Razorpay Checkout</div>
                    <div className="flex items-center gap-2 font-semibold"><FaCheck /> Cancel Anytime</div>
                    <div className="flex items-center gap-2 font-semibold"><FaQuestionCircle /> 14-Day Money Back</div>
                </div>

                <div className="mt-20 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400 mb-4">Why teams upgrade</p>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Built for startup operators, creator brands, and agencies that ship daily.</h2>
                        <p className="text-gray-400 leading-relaxed max-w-2xl mb-8">Every paid plan is designed to remove manual editing bottlenecks, speed up repurposing, and help your content team publish more without hiring more people.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { title: 'Faster turnaround', text: 'Go from long-form video to ready-to-publish assets in minutes.' },
                                { title: 'Better unit economics', text: 'Replace repetitive editing work with one scalable workflow.' },
                                { title: 'More consistent output', text: 'Keep branding, subtitles and publishing standards uniform.' }
                            ].map((item) => (
                                <div key={item.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400 mb-4">Common questions</p>
                        <div className="space-y-4">
                            {faqItems.map((item) => (
                                <div key={item.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeatureItem = ({ label, active }) => (
    <div className={`flex items-center gap-3 text-sm ${active ? 'text-gray-200' : 'text-gray-600'}`}>
        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${active ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-700'}`}>
            {active ? <FaCheck className="text-[10px]" /> : <FaTimes className="text-[10px]" />}
        </div>
        {label}
    </div>
);

export default PricingPlans;