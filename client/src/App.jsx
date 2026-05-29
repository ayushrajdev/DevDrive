import {
  createBrowserRouter,
  Link,
  NavLink,
  RouterProvider,
} from "react-router-dom";
import DirectoryView from "./DirectoryView";
import LoginForm from "./Login";
import RegisterForm from "./Register";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <DirectoryView />,
//   },
//   {
//     path: "/directory/:directoryIdFromUrl",
//     element: <DirectoryView />,
//   },
//   {
//     path: "/file/:fileId",
//     element: <DirectoryView />,
//   },
//   {
//     path: "/register",
//     element: <RegisterForm />,
//   },
//   {
//     path: "/login",
//     element: <LoginForm />,
//   },
// ]);

// const App = () => {
//   return <RouterProvider router={router} />;
// };

// const App = () => {
//   const { isPending, error, data } = useQuery({
//     queryKey: ["posts"],
//     queryFn: () =>
//       fetch("https://jsonplaceholder.typicode.com/posts").then((res) =>
//         res.json(),
//       ),
//     staleTime: 300000,
//   });
//   console.log(data);
//   return (
//     <div>
//       <div>
//         <Link to={"/"}>home</Link>
//         <br />
//         <Link to={"/rq"}>rq</Link>
//         <br />
//         <Link to={"/tq"}>tq</Link>
//       </div>
//       <h1>hello</h1>
//       <div>{JSON.stringify(data)}</div>
//     </div>
//   );
// };


import React, { useState } from 'react';
import { Check, Loader } from 'lucide-react';

const App = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentType, setPaymentType] = useState(null);
  const [billingCycle, setBillingCycle] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Perfect for getting started',
      price: 9,
      features: [
        'Up to 10 projects',
        '5GB storage',
        'Basic support',
        'Community access'
      ],
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'intermediate',
      name: 'Intermediate',
      description: 'For growing teams',
      price: 29,
      features: [
        'Unlimited projects',
        '100GB storage',
        'Priority support',
        'Team collaboration',
        'Advanced analytics'
      ],
      color: 'from-purple-500 to-purple-600',
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For enterprises',
      price: 99,
      features: [
        'Unlimited everything',
        '1TB storage',
        '24/7 dedicated support',
        'Advanced security',
        'API access',
        'Custom integrations'
      ],
      color: 'from-emerald-500 to-emerald-600'
    }
  ];

  const paymentTypes = [
    { id: 'subscription', label: 'Subscription', icon: '🔄' },
    { id: 'lifetime', label: 'Lifetime', icon: '∞' }
  ];

  const billingCycles = [
    { id: 'monthly', label: 'Monthly', description: 'Billed monthly' },
    { id: 'quarterly', label: 'Quarterly', description: 'Billed every 3 months' },
    { id: 'yearly', label: 'Yearly', description: 'Billed annually' }
  ];

  const providers = [
    { id: 'razorpay', name: 'Razorpay', logo: '💳', color: 'from-blue-500 to-blue-600' },
    { id: 'stripe', name: 'Stripe', logo: '🔵', color: 'from-indigo-500 to-indigo-600' }
  ];

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        planId: selectedPlan,
        paymentType: paymentType,
        billingCycle: paymentType === 'lifetime' ? 'lifetime' : billingCycle,
        provider: selectedProvider
      });

      // API call to backend
      const response = await fetch(`/api/initiate-payment?${queryParams.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Payment initiation failed');
      }

      const data = await response.json();

      // Redirect to payment URL
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const currentPlan = plans.find(p => p.id === selectedPlan);
  const isPaymentTypeSelected = paymentType !== null;
  const isBillingCycleSelected = paymentType === 'lifetime' || billingCycle !== null;
  const isProviderSelected = selectedProvider !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center pt-16 pb-12 px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-400">
            Select the perfect plan for your needs and unlock amazing features
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-20">
          {/* Step 1: Plan Selection */}
          {!selectedPlan && (
            <div className="animate-fadeIn">
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`group relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      plan.popular ? 'md:scale-105' : ''
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-0 right-0 flex justify-center">
                        <span className="bg-gradient-to-r from-orange-400 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className={`bg-gradient-to-br ${plan.color} p-0.5 rounded-2xl h-full`}>
                      <div className="bg-slate-900 rounded-2xl p-8 h-full flex flex-col">
                        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                        <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                        
                        <div className="mb-8">
                          <span className="text-5xl font-bold text-white">${plan.price}</span>
                          <span className="text-slate-400">/month</span>
                        </div>

                        <ul className="space-y-4 mb-8 flex-grow">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                              <span className="text-slate-300">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform group-hover:shadow-xl group-hover:shadow-${plan.color.split(' ')[1]}/50 bg-gradient-to-r ${plan.color} text-white`}>
                          Choose Plan
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Payment Type Selection */}
          {selectedPlan && !isPaymentTypeSelected && (
            <div className="animate-fadeIn max-w-2xl mx-auto">
              <button
                onClick={() => setSelectedPlan(null)}
                className="mb-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
              >
                ← Back to Plans
              </button>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {currentPlan.name} Plan
                </h2>
                <p className="text-slate-400 mb-8">
                  ${currentPlan.price}/month - Choose how you'd like to pay
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {paymentTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setPaymentType(type.id)}
                      className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 hover:border-slate-400 transition-all duration-300 text-left hover:shadow-lg hover:shadow-slate-500/20"
                    >
                      <div className="relative z-10">
                        <div className="text-4xl mb-4">{type.icon}</div>
                        <h3 className="text-xl font-bold text-white mb-2">{type.label}</h3>
                        {type.id === 'subscription' && (
                          <p className="text-slate-400 text-sm">Pay monthly, quarterly, or yearly</p>
                        )}
                        {type.id === 'lifetime' && (
                          <p className="text-slate-400 text-sm">One-time payment, forever access</p>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Billing Cycle Selection */}
          {selectedPlan && isPaymentTypeSelected && paymentType === 'subscription' && !isBillingCycleSelected && (
            <div className="animate-fadeIn max-w-2xl mx-auto">
              <button
                onClick={() => setPaymentType(null)}
                className="mb-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
              >
                ← Back
              </button>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Billing Cycle
                </h2>
                <p className="text-slate-400 mb-8">
                  How often would you like to be billed?
                </p>

                <div className="space-y-4">
                  {billingCycles.map((cycle) => (
                    <button
                      key={cycle.id}
                      onClick={() => setBillingCycle(cycle.id)}
                      className="w-full text-left p-6 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 border-2 border-slate-600 hover:border-slate-400 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/20 group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">{cycle.label}</h3>
                          <p className="text-slate-400 text-sm">{cycle.description}</p>
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-slate-400 group-hover:border-blue-400 transition-colors flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-transparent group-hover:bg-blue-400 transition-colors"></div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Payment Provider Selection */}
          {selectedPlan && isPaymentTypeSelected && isBillingCycleSelected && !isProviderSelected && (
            <div className="animate-fadeIn max-w-2xl mx-auto">
              <button
                onClick={() => {
                  if (paymentType === 'lifetime') {
                    setPaymentType(null);
                  } else {
                    setBillingCycle(null);
                  }
                }}
                className="mb-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
              >
                ← Back
              </button>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Select Payment Method
                </h2>
                <p className="text-slate-400 mb-8">
                  Choose your preferred payment provider
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                      className="group relative overflow-hidden rounded-xl p-8 bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 hover:border-slate-400 transition-all duration-300 text-center hover:shadow-lg hover:shadow-slate-500/20"
                    >
                      <div className="relative z-10">
                        <div className="text-6xl mb-4 flex justify-center">{provider.logo}</div>
                        <h3 className="text-2xl font-bold text-white">{provider.name}</h3>
                        <p className="text-slate-400 text-sm mt-2">
                          {provider.id === 'razorpay' ? 'Fast & secure payments' : 'Global payment platform'}
                        </p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Confirmation & Payment */}
          {selectedPlan && isPaymentTypeSelected && isBillingCycleSelected && isProviderSelected && (
            <div className="animate-fadeIn max-w-2xl mx-auto">
              <button
                onClick={() => setSelectedProvider(null)}
                className="mb-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
              >
                ← Back
              </button>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
                <h2 className="text-3xl font-bold text-white mb-8">
                  Order Summary
                </h2>

                <div className="space-y-6 mb-8">
                  <div className="flex justify-between items-center pb-6 border-b border-slate-700">
                    <span className="text-slate-400">Plan</span>
                    <span className="text-white font-semibold text-lg">
                      {currentPlan.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-6 border-b border-slate-700">
                    <span className="text-slate-400">Payment Type</span>
                    <span className="text-white font-semibold">
                      {paymentType === 'lifetime' ? 'Lifetime' : 'Subscription'}
                    </span>
                  </div>

                  {paymentType === 'subscription' && (
                    <div className="flex justify-between items-center pb-6 border-b border-slate-700">
                      <span className="text-slate-400">Billing Cycle</span>
                      <span className="text-white font-semibold capitalize">
                        {billingCycle}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pb-6 border-b border-slate-700">
                    <span className="text-slate-400">Payment Provider</span>
                    <span className="text-white font-semibold">
                      {providers.find(p => p.id === selectedProvider)?.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-6">
                    <span className="text-slate-300 text-lg">Total</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      ${currentPlan.price}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
                    <p className="text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-blue-500/50"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                    </>
                  )}
                </button>

                <p className="text-center text-slate-400 text-sm mt-6">
                  Your payment will be processed securely. You'll be redirected to {providers.find(p => p.id === selectedProvider)?.name} to complete the transaction.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;

