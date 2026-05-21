/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Smartphone, 
  User as UserIcon, 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  MessageSquare, 
  ChevronRight, 
  Send, 
  Star, 
  FileText, 
  Share2, 
  Cpu, 
  Plus, 
  MapPin, 
  Bell, 
  Sparkles, 
  ChevronDown, 
  Settings, 
  LogOut, 
  UserCheck, 
  CreditCard, 
  Layers, 
  Mic, 
  ShoppingBag, 
  Activity, 
  CornerDownRight, 
  Download,
  AlertTriangle,
  X,
  Play,
  ArrowRight
} from 'lucide-react';

import { 
  User, 
  RepairTicket, 
  UserRole, 
  RepairStage, 
  ServiceDefinition, 
  ChatMessage, 
  Notification, 
  RepairSuggestion, 
  VoiceParsingResponse, 
  ServiceType 
} from './types';

import AIChatbot from './components/AIChatbot';
import VoiceToOrder from './components/VoiceToOrder';

// PRELOADED DEMO REPAIR DATA FOR OUT-OF-THE-BOX WORKFLOW LAYOUTS
const INITIAL_DEMO_USERS: User[] = [
  {
    id: 'cust-1',
    email: 'client@global-phix.it',
    name: 'Global Phix.IT Client Partner',
    role: 'customer',
    phone: '+233 24 555 8921',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    verified: true
  },
  {
    id: 'tech-1',
    email: 'tech@global-phix.it',
    name: 'Global Phix.IT Premium Tech Partner',
    role: 'technician',
    phone: '+233 27 333 1192',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    verified: true,
    businessName: 'Integrated Device Repair Labs',
    rating: 5.0,
    completedJobs: 134
  },
  {
    id: 'admin-1',
    email: 'admin@global-phix.it',
    name: 'Global Phix.IT System Manager',
    role: 'admin',
    phone: '+233 20 111 2222',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
    verified: true
  }
];

const INITIAL_DEMO_TICKETS: RepairTicket[] = [];

const INITIAL_SERVICE_DEFINITIONS: ServiceDefinition[] = [
  {
    type: 'phone_repair',
    name: 'Micro Phone Repairs',
    tagline: 'Fix LCD, battery, charging ports & logic boards',
    description: 'Ghana’s highest-rated smart hardware technicians, providing instant quotes & video repair logging.',
    iconName: 'Smartphone',
    basePrice: '₵120',
    active: true
  }
];

export default function App() {
  // Navigation & Role controls
  const [activeRole, setActiveRole] = useState<UserRole>('customer');
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_DEMO_USERS[0]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // App state engine
  const [tickets, setTickets] = useState<RepairTicket[]>(() => {
    const local = localStorage.getItem('globalphix_tickets') || localStorage.getItem('swiftserve_tickets');
    return local ? JSON.parse(local) : INITIAL_DEMO_TICKETS;
  });
  
  const [services, setServices] = useState<ServiceDefinition[]>(() => {
    return INITIAL_SERVICE_DEFINITIONS;
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Auth States
  const [isLoggedOut, setIsLoggedOut] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'otp' | 'forgot'>('login');
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'customer' as UserRole,
    password: '',
    momoProvider: 'mtn',
    otpCode: ''
  });

  // Controlled Invoice Dialog Modal state and Toast controller
  const [invoiceModal, setInvoiceModal] = useState<{
    isOpen: boolean;
    ticketId: string;
    brand: string;
    model: string;
    amount: string;
  } | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
  };

  // Ticket Form States
  const [newTicket, setNewTicket] = useState({
    brand: 'Samsung',
    model: '',
    description: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
    type: 'walk-in' as 'pickup' | 'walk-in',
    date: new Date().toISOString().split('T')[0],
    imageFile: null as File | null,
    imageUrl: ''
  });
  
  const [aiSuggestion, setAiSuggestion] = useState<RepairSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Active Ticket Detailed Modal
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  const [chatInputs, setChatInputs] = useState<string>('');
  const [chats, setChats] = useState<ChatMessage[]>([]);

  // MoMo simulated screen status
  const [momoModal, setMomoModal] = useState<{
    isOpen: boolean;
    ticketId: string;
    amount: number;
    provider: string;
    number: string;
    status: 'prompt-sending' | 'user-input' | 'success' | 'failed';
  } | null>(null);

  // Review System Modal State
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    ticketId: string;
    rating: number;
    text: string;
  } | null>(null);

  // Admin Dispute Dialog Helper
  const [adminDisputeModal, setAdminDisputeModal] = useState<RepairTicket | null>(null);
  const [disputeResponse, setDisputeResponse] = useState('');

  // Dynamic lists for Admin Dashboard
  const [pendingTechs, setPendingTechs] = useState<{ id: string; name: string; region: string; initials: string; }[]>([]);

  const [activeDisputes, setActiveDisputes] = useState<{ id: string; customerName: string; description: string; amount: number; }[]>([]);

  // Save changes locally
  useEffect(() => {
    localStorage.setItem('globalphix_tickets', JSON.stringify(tickets));
    localStorage.setItem('swiftserve_tickets', JSON.stringify(tickets));
  }, [tickets]);

  // Toast automatic dismiss effect controller
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Role switching helper
  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    const resolvedUser = INITIAL_DEMO_USERS.find(u => u.role === role) || INITIAL_DEMO_USERS[0];
    setCurrentUser(resolvedUser);
    setActiveTab('dashboard');
  };

  // Debounced/Reactive AI Quote Suggestions while custom request form changes
  useEffect(() => {
    if (!newTicket.description || newTicket.description.length < 8) {
      setAiSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      setAiLoading(true);
      try {
        const response = await fetch('/api/ai/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand: newTicket.brand,
            model: newTicket.model,
            description: newTicket.description
          })
        });
        if (response.ok) {
          const result = await response.json();
          setAiSuggestion({
            possibleIssue: result.possibleIssue,
            recommendedRepair: result.recommendedRepair,
            estimatedCostMin: result.estimatedCostMin,
            estimatedCostMax: result.estimatedCostMax,
            estimatedDuration: result.estimatedDuration,
            confidence: result.confidence
          });
        }
      } catch (err) {
        console.error("Failure querying real-time AI cost guidelines:", err);
      } finally {
        setAiLoading(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [newTicket.brand, newTicket.model, newTicket.description]);

  // Handle voice order parsing callback
  const handleVoiceOrderParsed = (data: VoiceParsingResponse) => {
    setNewTicket({
      brand: data.brand || 'Samsung',
      model: data.model || '',
      description: data.description || '',
      urgency: data.urgency || 'medium',
      type: data.type || 'walk-in',
      date: new Date().toISOString().split('T')[0],
      imageFile: null,
      imageUrl: ''
    });

    setAiSuggestion({
      possibleIssue: data.possibleIssue,
      recommendedRepair: data.suggestedRepair,
      estimatedCostMin: data.estimatedCostMin,
      estimatedCostMax: data.estimatedCostMax,
      estimatedDuration: data.estimatedDuration,
      confidence: 90
    });
  };

  // Form Submission
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.model || !newTicket.description) {
      showToast("Please provide the device model and an issue description.");
      return;
    }

    const brandStr = newTicket.brand;
    const modelStr = newTicket.model;
    const descStr = newTicket.description;
    const urgType = newTicket.urgency;
    const isPickup = newTicket.type;

    const mockId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const freshTicket: RepairTicket = {
      id: mockId,
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      serviceType: 'phone_repair',
      title: `${brandStr} ${modelStr} Service Request`,
      brand: brandStr,
      model: modelStr,
      description: descStr,
      imageUrls: newTicket.imageUrl ? [newTicket.imageUrl] : [],
      urgency: urgType,
      type: isPickup,
      date: newTicket.date,
      stage: 'Request Received',
      stageHistory: [
        { stage: 'Request Received', timestamp: new Date().toISOString(), notes: 'Successfully synchronized into Global Phix.IT micro-channels.' }
      ],
      priceEstimate: aiSuggestion ? {
        min: aiSuggestion.estimatedCostMin,
        max: aiSuggestion.estimatedCostMax,
        label: aiSuggestion.possibleIssue
      } : { min: 120, max: 400, label: 'Manual technician inspection required' },
      paymentStatus: 'Unpaid',
      createdAt: new Date().toISOString()
    };

    setTickets(prev => [freshTicket, ...prev]);

    // Push technician notification
    const techNtf: Notification = {
      id: `ntf-${Math.random().toString(36).substr(2, 9)}`,
      userId: 'tech-1',
      title: `📲 New ${brandStr} ${modelStr} Request`,
      message: `${currentUser.name} requested immediate ${isPickup} details in Urgency: ${urgType}.`,
      type: 'new_request',
      isRead: false,
      timestamp: new Date().toISOString(),
      ticketId: mockId
    };
    setNotifications(prev => [techNtf, ...prev]);

    // Clean form
    setNewTicket({
      brand: 'Samsung',
      model: '',
      description: '',
      urgency: 'medium',
      type: 'walk-in',
      date: new Date().toISOString().split('T')[0],
      imageFile: null,
      imageUrl: ''
    });
    setAiSuggestion(null);
    setActiveTab('dashboard');

    // Trigger visual notification banner simulation
    showToast(`Success! Ticket ${mockId} has been created & synced directly with Accra Central technician queues.`);
  };

  // Chat message send handler
  const handleSendChat = (e: React.FormEvent, tktId: string) => {
    e.preventDefault();
    if (!chatInputs.trim()) return;

    const freshMsg: ChatMessage = {
      id: `c-${Date.now()}`,
      ticketId: tktId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: chatInputs,
      timestamp: new Date().toISOString()
    };

    setChats(prev => [...prev, freshMsg]);
    setChatInputs('');

    // Trigger micro technician AI auto reply message to represent chat realism
    setTimeout(() => {
      const answers = [
        "Alright, got your message! I will make sure the test ribbon and gasket replacements match the exact original factory specifications.",
        "Understood. Since we have standard parts buffer, display testing takes approximately 30 minutes. I will post a secure update immediately.",
        "Perfect digital confirmation. I am wrapping up the board diagnostics. Will trigger a USSD mobile money deposit prompt shortly!",
        "Diagnostics completed successfully! Let me know if you would like me to issue the final invoice now."
      ];
      const botResponse: ChatMessage = {
        id: `c-${Date.now() + 1}`,
        ticketId: tktId,
        senderId: currentUser.role === 'customer' ? 'tech-1' : 'cust-1',
        senderName: currentUser.role === 'customer' 
          ? (selectedTicket?.technicianName || 'Partner Specialist') 
          : (selectedTicket?.customerName || 'Client Gateway'),
        senderRole: currentUser.role === 'customer' ? 'technician' : 'customer',
        text: answers[Math.floor(Math.random() * answers.length)],
        timestamp: new Date().toISOString()
      };
      setChats(prev => [...prev, botResponse]);

      // Push a smart UI in-app alert notification
      const inlineNtf: Notification = {
        id: `ntf-${Math.random()}`,
        userId: currentUser.id,
        title: `💬 Support channel reply from ${botResponse.senderName}`,
        message: botResponse.text,
        type: 'chat',
        isRead: false,
        timestamp: new Date().toISOString(),
        ticketId: tktId
      };
      setNotifications(prev => [inlineNtf, ...prev]);
    }, 1500);
  };

  // Technician Stage updates handler
  const handleUpdateStage = (ticketId: string, targetStage: RepairStage, notes?: string) => {
    setTickets(prev => prev.map(tkt => {
      if (tkt.id === ticketId) {
        const historyEntry = {
          stage: targetStage,
          timestamp: new Date().toISOString(),
          notes: notes || `Diagnostic updated to: ${targetStage}`
        };
        const updatedHistory = [...tkt.stageHistory, historyEntry];
        return {
          ...tkt,
          stage: targetStage,
          stageHistory: updatedHistory,
          notes: notes || tkt.notes
        };
      }
      return tkt;
    }));

    // Trigger live customer updates with specialized messages
    const targetTkt = tickets.find(t => t.id === ticketId);
    if (targetTkt) {
      const inlineNtf: Notification = {
        id: `ntf-${Math.random()}`,
        userId: targetTkt.customerId,
        title: `🛠️ Progress Stage: ${targetStage}`,
        message: notes || `Your ${targetTkt.brand} ${targetTkt.model} repair workflow stage is updated dynamically to ${targetStage}.`,
        type: 'status_update',
        isRead: false,
        timestamp: new Date().toISOString(),
        ticketId: ticketId
      };
      setNotifications(prev => [inlineNtf, ...prev]);
    }
  };

  // Technician Invoicing handler
  const handleGenerateInvoice = (ticketId: string, amount: number) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          finalPrice: amount,
          paymentStatus: 'Unpaid'
        };
      }
      return t;
    }));

    const target = tickets.find(t => t.id === ticketId);
    if (target) {
      const inlineNtf: Notification = {
        id: `ntf-${Math.random()}`,
        userId: target.customerId,
        title: `🧾 Electronic Digital Invoice Issued`,
        message: `Technician ${target.technicianName || 'Partner Specialist'} issued an electronic invoice sum of GH₵ ${amount}.00 for your device.`,
        type: 'payment',
        isRead: false,
        timestamp: new Date().toISOString(),
        ticketId: ticketId
      };
      setNotifications(prev => [inlineNtf, ...prev]);
      showToast(`Secure digital invoice of GH₵ ${amount} generated successfully!`);
    }
  };

  // MoMo simulated deposit prompt
  const triggerMomoPayment = (ticketId: string, amount: number) => {
    setMomoModal({
      isOpen: true,
      ticketId,
      amount,
      provider: authForm.momoProvider || 'mtn',
      number: currentUser.phone,
      status: 'prompt-sending'
    });

    setTimeout(() => {
      setMomoModal(prev => {
        if (!prev) return null;
        return { ...prev, status: 'user-input' };
      });
    }, 1800);
  };

  const handleConfirmMomoPrompt = () => {
    if (!momoModal) return;
    setMomoModal(prev => prev ? { ...prev, status: 'success' } : null);

    setTickets(prev => prev.map(tkt => {
      if (tkt.id === momoModal.ticketId) {
        return {
          ...tkt,
          paymentStatus: 'Fully Paid',
          paymentMethod: 'momo_mtn' as any,
          paymentTransactionId: `TXN-MoMo-${Math.floor(10000000 + Math.random() * 90000000)}`
        };
      }
      return tkt;
    }));

    const targetTkt = tickets.find(t => t.id === momoModal.ticketId);
    if (targetTkt) {
      const inlineNtf: Notification = {
        id: `ntf-${Math.random()}`,
        userId: targetTkt.customerId,
        title: `✅ Payment Verified Successfully`,
        message: `Mobile Money transfer of GH₵ ${momoModal.amount}.50 approved instantly. Digital escrow holds funds safely for the repair workflow.`,
        type: 'payment',
        isRead: false,
        timestamp: new Date().toISOString(),
        ticketId: momoModal.ticketId
      };
      setNotifications(prev => [inlineNtf, ...prev]);
    }
  };

  // Feedback score rating helper
  const triggerRatingModal = (ticketId: string) => {
    setReviewModal({
      isOpen: true,
      ticketId,
      rating: 5,
      text: ''
    });
  };

  const submitReviewRating = () => {
    if (!reviewModal) return;
    setTickets(prev => prev.map(t => {
      if (t.id === reviewModal.ticketId) {
        return {
          ...t,
          rating: reviewModal.rating,
          reviewText: reviewModal.text,
          reviewDate: new Date().toISOString()
        };
      }
      return t;
    }));

    setReviewModal(null);
    showToast("Thank you for your valuable feedback! This builds authentic credibility for micro-repair shops across local communities.");
  };

  // Approve a Technician request (Admin)
  const handleApproveTech = (id: string, name: string) => {
    setPendingTechs(prev => prev.filter(p => p.id !== id));
    showToast(`Success! Handled background identification check and approved technician credential token for ${name}.`);
  };

  // Resolve a client dispute claim (Admin)
  const handleResolveDispute = (id: string, actionType: 'refund' | 'release', customerName: string, amount: number) => {
    setActiveDisputes(prev => prev.filter(d => d.id !== id));
    if (actionType === 'refund') {
      showToast(`Triggering GHS Refund escrow release of GH₵ ${amount}.00 to Customer ${customerName}.`);
    } else {
      showToast(`Escrow claim closed. Releasing GH₵ ${amount}.00 GHS safely to Technician.`);
    }
  };

  // Toggle modular future services active status (Admin Dashboard Multi-service toggle illustration)
  const handleToggleService = (type: ServiceType) => {
    setServices(prev => prev.map(srv => {
      if (srv.type === type) {
        return { ...srv, active: !srv.active };
      }
      return srv;
    }));
  };

  // Mock Social log mechanisms
  const triggerSocialLogin = (platform: string) => {
    showToast(`Connected identity verification channel securely with standard ${platform} gateway.`);
  };

  // Clear unread notifications
  const handleClearNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedUser = INITIAL_DEMO_USERS.find(u => u.email.toLowerCase() === authForm.email.toLowerCase());
    if (matchedUser) {
      setCurrentUser(matchedUser);
      setActiveRole(matchedUser.role);
      setIsLoggedOut(false);
      showToast(`Logged in successfully as ${matchedUser.name}!`);
    } else {
      const newUser: User = {
        id: `usr-${Math.floor(100 + Math.random() * 900)}`,
        email: authForm.email,
        name: authForm.email.split('@')[0],
        role: 'customer',
        phone: '+233 24 555 ' + Math.floor(1000 + Math.random() * 9000),
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        verified: true
      };
      setCurrentUser(newUser);
      setActiveRole('customer');
      setIsLoggedOut(false);
      showToast(`Welcome! Logged in as ${newUser.name}.`);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthView('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: `usr-${Math.floor(100 + Math.random() * 900)}`,
      email: authForm.email || 'user@global-phix.it',
      name: authForm.name || 'Global Phix.IT Client',
      role: authForm.role || 'customer',
      phone: authForm.phone || '+233 24 555 8921',
      avatarUrl: authForm.role === 'technician' 
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
        : 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&q=80',
      verified: true
    };
    setCurrentUser(newUser);
    setActiveRole(newUser.role);
    setIsLoggedOut(false);
    showToast(`Account successfully active! Registered as ${newUser.name}`);
  };

  // Helper values for technician analytic charts
  const monthlyRevenue = tickets
    .filter(t => t.paymentStatus === 'Fully Paid' || t.paymentStatus === 'Deposit Paid')
    .reduce((currentSum, tkt) => currentSum + (tkt.finalPrice || tkt.priceEstimate?.min || 150), 0);

  const completedCount = tickets.filter(t => t.stage === 'Completed').length;
  const inProgressCount = tickets.filter(t => t.stage !== 'Completed').length;

  return (
    <div className="relative min-h-screen font-sans bg-[#0A051E] text-slate-100 overflow-x-hidden antialiased">
      {/* Background Orbs & Radial Neon Mesh */}
      <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[2%] right-[-5%] w-[600px] h-[600px] bg-blue-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute top-[40%] left-[25%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Professional Role Nav Switcher */}
      <header className="sticky top-0 z-40 bg-slate-900/40 backdrop-blur-md border-b border-white/5 py-4 px-6 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white tracking-tight font-display">Global Phix.IT</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-500/30">Lagos-Accra-Nairobi</span>
              </div>
              <p className="text-[10px] text-slate-400">African Informal Service Business Gateway</p>
            </div>
          </div>

          {/* Quick Mock Role Toggle Bar */}
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/5 shadow-inner">
            <span className="text-[10px] text-slate-400 uppercase font-bold px-2 block tracking-wider">MOCK INTERACTIVE ROLES:</span>
            <button
              onClick={() => handleRoleChange('customer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRole === 'customer'
                  ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white shadow-md border border-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🙋 Customer
            </button>
            <button
              onClick={() => handleRoleChange('technician')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRole === 'technician'
                  ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white shadow-md border border-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔧 Tech Partner
            </button>
            <button
              onClick={() => handleRoleChange('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRole === 'admin'
                  ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white shadow-md border border-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💼 HQ Admin
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                className="w-8 h-8 rounded-full border border-white/20 shadow-md transform hover:scale-105 transition-transform" 
              />
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-white">{currentUser.name}</p>
                <p className="text-[9px] text-emerald-400 font-mono">● Online {currentUser.role === 'technician' && '(Verified Tech)'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Primary Responsive Dashboard Arrangement */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* UPPER NOTIFICATION BANNER IF CONFIGURED */}
        {notifications.filter(n => !n.isRead && n.userId === currentUser.id).length > 0 && (
          <div className="mb-6 bg-indigo-950/40 backdrop-blur-xl border border-indigo-500/20 p-4 rounded-3xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center animate-bounce text-indigo-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">LATEST SECURE TRANSACTION ALERT</span>
                <p className="text-xs text-slate-300">
                  {notifications.filter(n => !n.isRead && n.userId === currentUser.id)[0].message}
                </p>
              </div>
            </div>
            <button
              onClick={handleClearNotifications}
              className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 px-3 py-1 text-indigo-300 rounded-xl"
            >
              Clear
            </button>
          </div>
        )}

        {/* MOCK AUTHENTICATION CHECKPOINT BLOCKER IF DESIRED */}
        {isLoggedOut ? (
          <div className="max-w-md mx-auto my-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 text-center" id="auth-checkpoint">
            <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-6">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>

            {authView === 'login' && (
              <div>
                <h2 className="text-2xl font-bold font-display text-white mb-2">Login to Global Phix.IT</h2>
                <p className="text-xs text-slate-400 mb-6 font-sans">Enter credentials to unlock Africa's digital workflow operating system</p>
                
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="text-left space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={authForm.email}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-900 text-white font-medium" 
                    />
                  </div>
                  <div className="text-left space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300">Security Password</label>
                      <button type="button" onClick={() => setAuthView('forgot')} className="text-[10px] text-indigo-400 hover:underline">Forgot password?</button>
                    </div>
                    <input 
                      type="password" 
                      required 
                      value={authForm.password}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-900 text-white font-mono" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-sm text-white shadow-xl transition-all"
                  >
                    Authorize Session
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-center gap-2">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">social sync option</span>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => triggerSocialLogin('Google')} className="py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-white/10 flex items-center justify-center gap-1.5">
                    <span>Google Secure</span>
                  </button>
                  <button type="button" onClick={() => triggerSocialLogin('Apple ID')} className="py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-white/10 flex items-center justify-center gap-1.5">
                    <span>Apple verification</span>
                  </button>
                </div>

                <p className="mt-6 text-xs text-slate-400">
                  Don't have an account?{' '}
                  <button onClick={() => setAuthView('signup')} className="text-indigo-400 font-bold hover:underline">Create Digital ID</button>
                </p>
              </div>
            )}

            {authView === 'signup' && (
              <div>
                <h2 className="text-2xl font-bold font-display text-white mb-2">Create Global Phix.IT Account</h2>
                <p className="text-xs text-slate-400 mb-6 font-sans">Choose your business identity category</p>

                <form onSubmit={handleSignupSubmit} className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Full Business / Personal Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Your Name or Business Name" 
                      value={authForm.name}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="email@address.com" 
                      value={authForm.email}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Security Password</label>
                    <input 
                      type="password" 
                      required 
                      placeholder="••••••••" 
                      value={authForm.password}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Active Mobile Number for MoMo Pay</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="+233 24 000 0000" 
                      value={authForm.phone}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 text-left">Primary business category</label>
                    <select 
                      value={authForm.role}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                      className="w-full bg-[#0d0726] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none"
                    >
                      <option value="customer">Regular Customer (Needs local repairs/services)</option>
                      <option value="technician">Professional Technician Partner (Wants to work & earn)</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-bold text-sm text-white mt-6 shadow-xl">
                    Request Secure Activation OTP
                  </button>
                </form>

                <p className="mt-6 text-xs text-slate-400">
                  Already have an account?{' '}
                  <button onClick={() => setAuthView('login')} className="text-indigo-400 font-bold hover:underline">Log In</button>
                </p>
              </div>
            )}

            {authView === 'otp' && (
              <div>
                <h2 className="text-2xl font-bold font-display text-white mb-2">OTP Verification Check</h2>
                <p className="text-xs text-slate-400 mb-6 font-sans">A simulated 4-digit code has been routed to your phone via SMS & WhatsApp.</p>

                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div className="flex justify-center gap-2">
                    <input 
                      type="text" 
                      maxLength={4} 
                      required 
                      placeholder="3941" 
                      value={authForm.otpCode}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, otpCode: e.target.value }))}
                      className="w-36 text-center text-xl font-bold font-mono bg-slate-900/50 border border-indigo-500 rounded-xl focus:ring-2 focus:ring-indigo-400 text-white tracking-widest py-2.5" 
                    />
                  </div>
                  <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl font-bold text-sm text-white mt-4 shadow-xl">
                    Verify & Authenticate Account
                  </button>
                </form>
              </div>
            )}

            {authView === 'forgot' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Forgot Password?</h2>
                <p className="text-xs text-slate-400 mb-6">Enter your registered email below and we will automatically dispatch a secure OTP recovery message.</p>
                <form onSubmit={(e) => { e.preventDefault(); showToast("Interactive SMS recovery dispatched successfully."); setAuthView('login'); }} className="space-y-4 text-left">
                  <input 
                    type="email" 
                    placeholder="email@address.com" 
                    required 
                    value={authForm.email}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" 
                  />
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">
                    Submit password reset request
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          
          /* CORE APP INTERACTIVE VIEWS */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* SIDEBAR NAVIGATION PANEL (FROSTED GLASS CARD style from the instructions) */}
            <aside className="lg:col-span-1 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex flex-col gap-6 h-fit h-auto relative z-10">
              <div className="space-y-4">
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block font-mono">Service Navigation</span>
                <nav className="flex flex-col gap-1.5">
                  <button
                    onClick={() => { setActiveTab('dashboard'); }}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                      activeTab === 'dashboard'
                        ? 'bg-white/15 text-white border border-white/10 font-bold shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      <span>{currentUser.role === 'customer' ? 'My Repairs Portal' : currentUser.role === 'technician' ? 'Technician Board' : 'HQ Global Overview'}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => { setActiveTab('services'); }}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                      activeTab === 'services'
                        ? 'bg-white/15 text-white border border-white/10 font-bold shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>Explore Services</span>
                    </span>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-200 px-1.5 py-0.5 rounded uppercase font-semibold">Active</span>
                  </button>

                  {currentUser.role === 'customer' && (
                    <button
                      onClick={() => { setActiveTab('new-repair'); }}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                        activeTab === 'new-repair'
                          ? 'bg-white/15 text-white border border-white/10 font-bold shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Wrench className="w-4 h-4 text-emerald-400" />
                        <span>Book Smart Service</span>
                      </span>
                      <Plus className="w-4 h-4 text-indigo-400" />
                    </button>
                  )}

                  <button
                    onClick={() => { setActiveTab('history'); }}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                      activeTab === 'history'
                        ? 'bg-white/15 text-white border border-white/10 font-bold shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Transactions Hub</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => { setActiveTab('settings'); }}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                      activeTab === 'settings'
                        ? 'bg-white/15 text-white border border-white/10 font-bold shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Security & Profile</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </nav>
              </div>

              {/* FUTURE SYSTEM EXPANSION DRAWER SHIFT SHOWCASE */}
              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4 rounded-3xl border border-white/5 text-left mt-4">
                <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                  <Sparkles className="h-3 w-3" />
                  Future Ready Gateway
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Design built dynamically to auto-scale from Phone Repairs to <strong>Errands, Laundry, and Market Logistics</strong> without altering underlying structural schemas.
                </p>
                <div className="mt-3.5 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden block">
                  <div className="h-full w-4/5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* ACTIVE SESSION HIGHLIGHT */}
              <div className="pt-4 border-t border-white/5 mt-auto flex flex-col gap-2.5 text-left">
                <div>
                  <span className="text-[9px] text-slate-400 font-mono italic">AUTHENTICATED DIGITAL KEY</span>
                  <div className="text-xs font-mono font-bold text-indigo-300 bg-slate-900/40 p-2 rounded-lg truncate select-all">
                    UID-{currentUser.id.toUpperCase()}-026
                  </div>
                </div>
                <button
                  onClick={() => setIsLoggedOut(true)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-white transition-all w-full"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout Security Key</span>
                </button>
              </div>
            </aside>

            {/* MAIN CONTENT DISPLAY AREA */}
            <main className="lg:col-span-3 flex flex-col gap-6 relative z-10 transition-all">
              
              {/* 1. CUSTOMER PORTAL & ACTIONS VIEW */}
              {currentUser.role === 'customer' && activeTab === 'dashboard' && (
                <div className="space-y-6">
                  
                  {/* Hero banner summary widget with Quick buttons */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="text-left space-y-2 max-w-xl">
                      <h1 className="text-2xl md:text-3.5xl font-black font-display text-white leading-tight">
                        Digitize Your Repairs & Logistics Effortlessly
                      </h1>
                      <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                        Track progress visually, chat in real-time with certified Ghanaian technician professionals, and settle balances dynamically with MTN MoMo or Telecel secure escrow accounts.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 shrink-0">
                      <button
                        onClick={() => { setActiveTab('new-repair'); }}
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs px-6 py-4 rounded-2xl shadow-lg transition-all"
                        id="open-new-ticket-btn"
                      >
                        ⚡ Standard Repair Request
                      </button>
                    </div>
                  </div>

                  {/* VOICE TO ORDER INTEGRATION HIGHLIGHT (AI Features requested) */}
                  <VoiceToOrder onTicketParsed={handleVoiceOrderParsed} />

                  {/* ACTIVE REPAIR TICKETS PROGRESS GRID */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-left">
                        <h2 className="text-lg font-bold text-white font-display">Active Service Repairs Tracker</h2>
                        <p className="text-xs text-slate-400">Visual real-time tracking of diagnostic & repair stages</p>
                      </div>
                      <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full">
                        {tickets.filter(t => t.customerId === currentUser.id && t.stage !== 'Completed').length} Pending Tasks
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tickets.filter(tkt => tkt.customerId === currentUser.id).length === 0 ? (
                        <div className="col-span-1 md:col-span-2 bg-white/5 border border-white/10 rounded-[28px] p-8 text-center space-y-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto border border-white/10">
                            <Smartphone className="w-6 h-6 text-indigo-400" />
                          </div>
                          <div className="max-w-md mx-auto space-y-1">
                            <h4 className="text-sm font-bold text-white">No active repairs found</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              You have no pending micro-repairs. Start a secure job by tapping "Standard Repair Request" or speak directly to our Voice-to-Order AI assistant!
                            </p>
                          </div>
                        </div>
                      ) : (
                        tickets
                          .filter(tkt => tkt.customerId === currentUser.id)
                          .map(tkt => (
                            <div 
                              key={tkt.id}
                              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all flex flex-col justify-between cursor-pointer group"
                              onClick={() => setSelectedTicket(tkt)}
                              id={`ticket-card-${tkt.id}`}
                            >
                              <div className="flex items-start justify-between gap-2.5 mb-4">
                                <div className="text-left">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase bg-indigo-500/20 px-2 py-0.5 rounded-lg">
                                      {tkt.id}
                                    </span>
                                    {tkt.urgency === 'high' && (
                                      <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">High Urgency</span>
                                    )}
                                  </div>
                                  <h3 className="text-sm font-bold text-white tracking-wide group-hover:text-indigo-300 transition-colors">
                                    {tkt.brand} {tkt.model}
                                  </h3>
                                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                    {tkt.description}
                                  </p>
                                </div>
                                <span className={`px-3 py-1.5 rounded-full text-[10px] uppercase font-bold text-center inline-block ${
                                  tkt.stage === 'Completed'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>
                                  {tkt.stage}
                                </span>
                              </div>

                              {/* visual progress timeline mini indicator */}
                              <div className="my-3 space-y-1.5">
                                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                  <span>REPAIR FLOW</span>
                                  <span className="text-indigo-300 capitalize">{tkt.type} Gateway</span>
                                </div>
                                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-white/5">
                                  <div className={`h-full rounded-full transition-all flex-1 ${tkt.stageHistory.length >= 1 ? 'bg-primary-500' : 'bg-slate-700'}`}></div>
                                  <div className={`h-full rounded-full transition-all flex-1 ${tkt.stageHistory.length >= 2 ? 'bg-primary-500 animate-pulse' : 'bg-slate-700'}`}></div>
                                  <div className={`h-full rounded-full transition-all flex-1 ${tkt.stageHistory.length >= 3 ? 'bg-primary-500' : 'bg-slate-700'}`}></div>
                                  <div className={`h-full rounded-full transition-all flex-1 ${tkt.stage === 'Completed' ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-300 mt-2">
                                <div>
                                  <span className="text-[9px] text-slate-400 block font-mono">FINANCIAL STATUS</span>
                                  <span className={`font-semibold ${tkt.paymentStatus === 'Fully Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {tkt.paymentStatus} • GH₵ {tkt.finalPrice || tkt.priceEstimate?.min || 150}
                                  </span>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTicket(tkt);
                                  }}
                                  className="text-[10px] font-semibold text-indigo-400 hover:text-white flex items-center gap-1 hover:underline"
                                >
                                  <span>Support Channels & Pay</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. SERVICES EXPLORER WORKSPACE (Scalable Multi-Service Infrastructure Architecture) */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <div className="text-left space-y-1">
                    <h1 className="text-2xl font-bold text-white font-display">Global Phix.IT Professional Device Repair Market</h1>
                    <p className="text-xs text-slate-400">The premier platform to request certified, high-quality, and secure phone and device repairs with instant AI diagnostics.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map(srv => {
                      const isActive = srv.active;
                      return (
                        <div 
                          key={srv.type}
                          className={`bg-white/5 backdrop-blur-md rounded-[28px] p-6 border transition-all text-left relative overflow-hidden flex flex-col justify-between ${
                            isActive
                              ? 'border-indigo-500 shadow-lg shadow-indigo-500/10'
                              : 'border-white/5 opacity-75 hover:opacity-100 hover:border-white/10'
                          }`}
                        >
                          {/* Top Tag Status */}
                          <div className="absolute top-4 right-4 text-[9px] font-bold tracking-widest font-mono uppercase">
                            {isActive ? (
                              <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20">Active</span>
                            ) : (
                              <span className="text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-500/20">Next Phase Expand</span>
                            )}
                          </div>

                          <div className="space-y-2 mb-6">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white mb-2">
                              <Smartphone className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h3 className="text-base font-bold text-white">{srv.name}</h3>
                            <p className="text-xs text-slate-300 italic">{srv.tagline}</p>
                            <p className="text-xs text-slate-400 leading-relaxed">{srv.description}</p>
                          </div>

                          <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                            <div>
                              <span className="text-[9px] text-slate-400 block font-mono">BASE TRANSACTION FEES</span>
                              <span className="text-white font-bold">{srv.basePrice} GHS</span>
                            </div>

                            {isActive ? (
                              <button 
                                onClick={() => { setActiveTab('new-repair'); }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all"
                              >
                                Connect Now
                              </button>
                            ) : (
                              <button 
                                disabled
                                className="bg-white/5 text-slate-400 font-medium text-xs py-2 px-4 rounded-xl cursor-not-allowed border border-white/5"
                              >
                                Launch Alert On
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. PHONE REPAIR REQUEST FORM VIEW (AI-Powered suggestions built in) */}
              {activeTab === 'new-repair' && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 text-left max-w-2xl mx-auto space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white font-display">Begin Your Service Diagnostics Request</h1>
                    <p className="text-xs text-slate-400">Describe physical or software symptoms to prompt our intelligent diagnostic estimation engine.</p>
                  </div>

                  {/* AI Quick Voice prompt hint */}
                  <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                      <Mic className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] text-indigo-200">
                      Did you know? You can scroll down to the <strong>Voice-to-Order</strong> console on the dashboard tab to state your request vocally instead!
                    </p>
                  </div>

                  <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Device Brand</label>
                        <select
                          value={newTicket.brand}
                          onChange={(e) => setNewTicket(prev => ({ ...prev, brand: e.target.value }))}
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                        >
                          <option value="Samsung">Samsung Electronics</option>
                          <option value="Apple">Apple iPhone</option>
                          <option value="TECNO">TECNO Mobile</option>
                          <option value="Infinix">Infinix Mobiles</option>
                          <option value="Huawei">Huawei Technologies</option>
                          <option value="Nokia">Nokia / Generic Android</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Exact Model Name / SKU</label>
                        <input
                          type="text"
                          required
                          value={newTicket.model}
                          onChange={(e) => setNewTicket(prev => ({ ...prev, model: e.target.value }))}
                          placeholder="e.g. Galaxy S23, iPhone 14 Pro"
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-300">Explain the Sickness/Problem</label>
                        <span className="text-[10px] text-slate-400 font-mono italic">Type e.g., "cracked screen" or "charging pin" for AI quotes</span>
                      </div>
                      <textarea
                        required
                        value={newTicket.description}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        placeholder="My screen is shattered and flashes green lines. Device charges normally but touch digitizer is fully unresponsive after falling."
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>

                    {/* AI Smart Quote Engine Display */}
                    {(aiLoading || aiSuggestion) && (
                      <div className="bg-gradient-to-r from-purple-950/40 to-indigo-950/40 p-5 rounded-2xl border border-indigo-500/20 text-left space-y-2.5">
                        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                          <Cpu className="w-4 h-4 text-purple-400 animate-spin" />
                          <span>Global Phix.IT AI Diagnostics Estimate</span>
                          <span className="text-[9px] bg-indigo-500/30 text-indigo-100 px-1.5 py-0.5 rounded">Processed in Clouds</span>
                        </div>

                        {aiLoading ? (
                          <p className="text-xs text-slate-400 italic">Analyzing device symptoms and mapping Accra regional inventories...</p>
                        ) : aiSuggestion ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-mono">Probable physical diagnosis</span>
                                <span className="font-semibold text-indigo-100 block">{aiSuggestion.possibleIssue}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-mono">Recommended service repair standard</span>
                                <span className="font-semibold text-indigo-100 block">{aiSuggestion.recommendedRepair}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs pt-2 border-t border-white/5">
                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-mono">Estimated cost guideline (GHS)</span>
                                <span className="text-sm font-black text-accent-300">GH₵ {aiSuggestion.estimatedCostMin} - GH₵ {aiSuggestion.estimatedCostMax}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-mono">Estimated completion duration</span>
                                <span className="font-semibold text-indigo-100 block">{aiSuggestion.estimatedDuration}</span>
                              </div>
                            </div>
                            <div className="text-[9.5px] text-slate-500 flex items-center gap-1.5 font-mono">
                              <span>Confidence Metric: {aiSuggestion.confidence}%</span>
                              <div className="h-1 flex-1 bg-slate-900 rounded overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${aiSuggestion.confidence}%` }}></div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Service Urgency</label>
                        <select
                          value={newTicket.urgency}
                          onChange={(e: any) => setNewTicket(prev => ({ ...prev, urgency: e.target.value }))}
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                        >
                          <option value="low">Low (Standard repair, no rush)</option>
                          <option value="medium">Medium (Requires fix within 48h)</option>
                          <option value="high">High (Extremely Urgent • Urgent Sourcing)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Delivery/Drop-off Style</label>
                        <select
                          value={newTicket.type}
                          onChange={(e: any) => setNewTicket(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                        >
                          <option value="walk-in">Standard Walk-In to Central Shop Hub</option>
                          <option value="pickup">Escrow Pickup Courier from Doorstep (₵15 GHS fee)</option>
                        </select>
                      </div>
                    </div>

                    {/* MOCK IMAGE URL PLACEHOLDER FOR TESTING */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 block">Optional: Paste Device Symptom Image URL</label>
                      <input 
                        type="url"
                        value={newTicket.imageUrl}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, imageUrl: e.target.value }))}
                        placeholder="https://images.unsplash.com/photo-1621330396173-e41b1cafd17f?auto=format&fit=crop&w=400&q=80"
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                      />
                    </div>

                    <div className="pt-4 border-t border-white/5 flex gap-3 h-auto">
                      <button
                        type="button"
                        onClick={() => { setActiveTab('dashboard'); }}
                        className="py-3 px-6 bg-white/5 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg"
                      >
                        Securely Sync Repair Ticket
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 4. TRANSACTIONS & RECEIPTS HISTORY TAB */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="text-left space-y-1">
                    <h1 className="text-2xl font-bold text-white font-display">Transactions & Electronic Receipts Hub</h1>
                    <p className="text-xs text-slate-400">Review your payment status log files and download official PDF/HTML accounting slips.</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden text-left">
                    <table className="w-full border-collapse text-xs md:text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 uppercase font-mono text-slate-400 text-[10px]">
                          <th className="p-4 text-left">Invoice / TicketID</th>
                          <th className="p-4 text-left">Device Detail</th>
                          <th className="p-4 text-left">Paid Date</th>
                          <th className="p-4 text-left">Settle Mode</th>
                          <th className="p-4 text-left">Amount GHS</th>
                          <th className="p-4 text-left">Operation Status</th>
                          <th className="p-4 text-center">Receipts Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {tickets.map(tkt => (
                          <tr key={tkt.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono font-bold text-indigo-300">{tkt.id}</td>
                            <td className="p-4">
                              <span className="font-bold text-white block">{tkt.brand}</span>
                              <span className="text-[11px] text-slate-400">{tkt.model}</span>
                            </td>
                            <td className="p-4 font-mono">{tkt.date}</td>
                            <td className="p-4 font-semibold capitalize text-indigo-200">
                              {tkt.paymentMethod ? tkt.paymentMethod.replace('momo_', 'MoMo ') : 'No Settle channel yet'}
                            </td>
                            <td className="p-4 font-bold text-white">GH₵ {tkt.finalPrice || tkt.priceEstimate?.min || 150}.00</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                tkt.paymentStatus === 'Fully Paid'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : tkt.paymentStatus === 'Deposit Paid'
                                  ? 'bg-blue-500/20 text-indigo-300'
                                  : 'bg-amber-500/20 text-amber-500'
                              }`}>
                                {tkt.paymentStatus}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {tkt.paymentStatus === 'Unpaid' ? (
                                <button
                                  onClick={() => triggerMomoPayment(tkt.id, tkt.finalPrice || tkt.priceEstimate?.min || 150)}
                                  className="mx-auto bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-2.5 py-1 rounded"
                                >
                                  Pay Balance
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    showToast(`Generating invoice receipt stream for ticket ${tkt.id}. Settle amount: GH₵ ${tkt.finalPrice || 150}.00. Global Phix.IT Escrow Secured.`);
                                  }}
                                  className="mx-auto bg-white/10 hover:bg-white/20 text-[10px] text-white px-2.5 py-1 rounded flex items-center justify-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>HTML Slip</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. TECHNICIAN WORKFLOW PARTNER DASHBOARD VIEW */}
              {currentUser.role === 'technician' && activeTab === 'dashboard' && (
                <div className="space-y-6">
                  
                  {/* Premium SaaS Header Statistics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-6 text-left flex flex-col justify-center">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">My Earnings Escrow</p>
                      <p className="text-2.5xl font-black text-white mt-1">GH₵ {monthlyRevenue}.00</p>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1.5 mt-2">
                        <TrendingUp className="w-3 h-3" />
                        Accra Central Hub Performance
                      </span>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-6 text-left flex flex-col justify-center">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">Assigned Repair Queue</p>
                      <p className="text-2.5xl font-black text-indigo-300 mt-1">{inProgressCount} Tickets Active</p>
                      <span className="text-[10px] text-indigo-400 flex items-center gap-1.5 mt-2">
                        <Clock className="w-3 h-3" />
                        Avg duration: 3.5 Hours
                      </span>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-6 text-left flex flex-col justify-center">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">Succeeded Repairs</p>
                      <p className="text-2.5xl font-black text-emerald-400 mt-1">{completedCount} Total</p>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1.5 mt-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        100% Sourcing accuracy
                      </span>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-6 text-left flex flex-col justify-center">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">Averaged Trust Rating</p>
                      <p className="text-2.5xl font-black text-yellow-400 mt-1">4.92 / 5.0</p>
                      <span className="text-[10px] text-yellow-400 flex items-center gap-1 mt-2">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        134 Verified local reviews
                      </span>
                    </div>
                  </div>

                  {/* SVG Premium Interactive Workflow Chart panel */}
                  <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-6 border border-white/10 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-white font-display">Completed Repairs Trend Diagnostics</h3>
                        <p className="text-xs text-slate-400">Monthly breakdown of localized smartphone ticket categories</p>
                      </div>
                      <div className="flex gap-2 text-[10px] font-mono">
                        <span className="flex items-center gap-1 text-slate-300"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm inline-block"></span>Samsung</span>
                        <span className="flex items-center gap-1 text-slate-300"><span className="w-2.5 h-2.5 bg-purple-500 rounded-sm inline-block"></span>Apple iPhone</span>
                        <span className="flex items-center gap-1 text-slate-300"><span className="w-2.5 h-2.5 bg-amber-500 rounded-sm inline-block"></span>TECNO / Infinix</span>
                      </div>
                    </div>

                    <div className="h-44 w-full flex items-end gap-3 px-2 border-b border-white/10 pb-2 relative">
                      {/* background coordinate alignment lines */}
                      <div className="absolute top-0 left-0 right-0 border-t border-white/5 text-[9px] text-slate-500 pr-2 pt-1 font-mono text-right">Limit 50 repairs</div>
                      <div className="absolute top-1/2 left-0 right-0 border-t border-white/5 text-[9px] text-slate-500 pr-2 pt-1 font-mono text-right">Avg 25 repairs</div>

                      {/* Mon SVG graphic representation bars */}
                      <div className="flex-1 flex flex-col justify-end items-center h-full gap-1">
                        <div className="w-full flex gap-1 h-32 items-end">
                          <div className="w-1/3 bg-indigo-500 hover:brightness-110 rounded-t h-[40%]" title="Samsung"></div>
                          <div className="w-1/3 bg-purple-500 hover:brightness-110 rounded-t h-[30%]" title="Apple"></div>
                          <div className="w-1/3 bg-amber-500 hover:brightness-110 rounded-t h-[60%]" title="Infinix"></div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Accra Central</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-end items-center h-full gap-1">
                        <div className="w-full flex gap-1 h-32 items-end">
                          <div className="w-1/3 bg-indigo-500 hover:brightness-110 rounded-t h-[70%]" title="Samsung"></div>
                          <div className="w-1/3 bg-purple-500 hover:brightness-110 rounded-t h-[45%]" title="Apple"></div>
                          <div className="w-1/3 bg-amber-500 hover:brightness-110 rounded-t h-[35%]" title="Infinix"></div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Lagos Mainland</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-end items-center h-full gap-1">
                        <div className="w-full flex gap-1 h-32 items-end">
                          <div className="w-1/3 bg-indigo-500 hover:brightness-110 rounded-t h-[55%]" title="Samsung"></div>
                          <div className="w-1/3 bg-purple-500 hover:brightness-110 rounded-t h-[80%]" title="Apple"></div>
                          <div className="w-1/3 bg-amber-500 hover:brightness-110 rounded-t h-[40%]" title="Infinix"></div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Nairobi CBD</span>
                      </div>
                    </div>
                  </div>

                  {/* AI INTEGRATED TECHNICIAN COPILOT WORKBENCH INSIGHTS */}
                  <div className="p-5 bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-indigo-500/20 rounded-3xl text-left space-y-3.5">
                    <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-widest font-mono">
                      <Cpu className="w-4 h-4 text-purple-400 animate-spin" />
                      <span>Global Phix.IT Certified AI Technician Copilot</span>
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-300 list-disc list-inside">
                      <li>⚠️ <strong>Stock Alerts</strong>: iPhone 11 & XR replacement display panels Surged in demand in Kejetia Market region (40% inventory depletion speed).</li>
                      <li>💡 <strong>Upsell Recommendation</strong>: {tickets.some(t => t.technicianId === currentUser.id) ? `${tickets.find(t => t.technicianId === currentUser.id)?.customerName} (${tickets.find(t => t.technicianId === currentUser.id)?.brand} ${tickets.find(t => t.technicianId === currentUser.id)?.model})` : 'Active clients'} hold high potential. Recommend offering premium hydrophobic protector coating protection at GH₵ 35 GHS.</li>
                      <li>🔧 <strong>Operations Optimization</strong>: Voice transcripts with symptoms relating to "water" have doubled over the weekend. Settle equipment pre-heating diagnostic arrays today.</li>
                    </ul>
                  </div>

                  {/* ACTIVE WORK ORDER CARDS QUEUE FOR TECHNICIAN TO TAKE ACTION */}
                  <div>
                    <h3 className="text-lg font-bold text-white font-display text-left mb-4">Assigned Active Repair Work Orders</h3>
                    <div className="space-y-4">
                      {tickets.filter(t => t.technicianId === currentUser.id).length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-[28px] p-8 text-center space-y-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto border border-white/10">
                            <Wrench className="w-6 h-6 text-indigo-400" />
                          </div>
                          <div className="max-w-md mx-auto space-y-1">
                            <h4 className="text-sm font-bold text-white">No active assigned jobs</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              You currently have no active assigned repairs. Once clients submit requests via Global Phix.IT, they will route instantly to your queue for diagnosis and escrow settlement actions.
                            </p>
                          </div>
                        </div>
                      ) : (
                        tickets
                          .filter(t => t.technicianId === currentUser.id)
                          .map(tkt => (
                            <div 
                              key={tkt.id}
                              className="bg-white/5 border border-white/10 rounded-[28px] p-6 text-left hover:bg-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                              <div className="space-y-2.5 max-w-xl">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-[10px] font-mono text-indigo-300 font-bold bg-indigo-500/20 px-2 py-0.5 rounded-lg">{tkt.id}</span>
                                  <span className="text-xs font-semibold text-slate-200">{tkt.customerName} • {tkt.customerPhone}</span>
                                  <span className="text-xs text-slate-400 italic">Requested Appt: {tkt.date}</span>
                                </div>
                                <h4 className="text-base font-bold text-white">{tkt.brand} {tkt.model}</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">{tkt.description}</p>
                                
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span className="text-[10px] bg-slate-900 text-slate-300 px-2.5 py-1 rounded-full border border-white/5">
                                    Stage: <strong>{tkt.stage}</strong>
                                  </span>
                                  <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/10">
                                    Urgency: <strong className="uppercase">{tkt.urgency}</strong>
                                  </span>
                                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/10">
                                    Payment: <strong>{tkt.paymentStatus}</strong> (GH₵ {tkt.finalPrice || tkt.priceEstimate?.min || 150}.00)
                                  </span>
                                </div>
                              </div>

                              {/* Tech action tools */}
                              <div className="flex flex-col gap-2 shrink-0">
                                <span className="text-[9px] text-slate-400 uppercase font-mono font-bold block mb-1">Update Repair Stage</span>
                                
                                <div className="flex flex-wrap gap-1.5">
                                  <button
                                    onClick={() => handleUpdateStage(tkt.id, 'Diagnosing', 'Technician started physical motherboard inspection.')}
                                    className="px-2 py-1.5 bg-white/5 hover:bg-indigo-600 text-white hover:text-white rounded-lg text-[10px] transition-all font-semibold"
                                  >
                                    Diagnose
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStage(tkt.id, 'Repair In Progress', 'Delicate micro soldering and screen fitting in progress.')}
                                    className="px-2 py-1.5 bg-white/5 hover:bg-indigo-600 text-white hover:text-white rounded-lg text-[10px] transition-all font-semibold"
                                  >
                                    Repair
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStage(tkt.id, 'Ready for Pickup', 'Tested diagnostic pins. Reconnect parameters healthy.')}
                                    className="px-2 py-1.5 bg-white/5 hover:bg-indigo-600 text-white hover:text-white rounded-lg text-[10px] transition-all font-semibold"
                                  >
                                    Ready
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStage(tkt.id, 'Completed', 'Handover completely verified. Escrow balance released.')}
                                    className="px-2 py-1.5 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] transition-all font-bold"
                                  >
                                    Complete
                                  </button>
                                </div>

                                <div className="mt-3 pt-3 border-t border-white/5 flex gap-2 h-auto">
                                  <button
                                    onClick={() => {
                                      setInvoiceModal({
                                        isOpen: true,
                                        ticketId: tkt.id,
                                        brand: tkt.brand,
                                        model: tkt.model,
                                        amount: String(tkt.priceEstimate?.min || 150)
                                      });
                                    }}
                                    className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-[10px] font-bold shadow-md hover:-translate-y-0.5 transition-all text-center block"
                                  >
                                    Generate Invoice
                                  </button>
                                  <button
                                    onClick={() => setSelectedTicket(tkt)}
                                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold transition-all text-center flex items-center justify-center"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. ADMIN SYSTEM DASHBOARD OVERPLAY (HQ GLOBAL MANAGEMENT) */}
              {currentUser.role === 'admin' && activeTab === 'dashboard' && (
                <div className="space-y-6 text-left font-sans">
                  
                  {/* HQ global stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/5">
                      <span className="text-slate-400 block text-xs uppercase font-mono">Total Platform Operations</span>
                      <p className="text-2xl font-bold text-white mt-1">₵{tickets.reduce((sum, t) => sum + (t.finalPrice || t.priceEstimate?.min || 150), 0).toFixed(2)} GHS</p>
                      <span className="text-[10px] text-emerald-400">12 Escrowed Repair Jobs In Action</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/5">
                      <span className="text-slate-400 block text-xs uppercase font-mono">Affiliated Small Shop partners</span>
                      <p className="text-2xl font-bold text-slate-100 mt-1">48 Active Techs</p>
                      <span className="text-[10px] text-slate-300">Verification Rate: 100% (National Check)</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/5">
                      <span className="text-slate-400 block text-xs uppercase font-mono">User Dispute Claims</span>
                      <p className="text-2xl font-bold text-rose-400 mt-1">1 Open Ticket</p>
                      <span className="text-[10px] text-rose-300">Awaiting HQ Mediation support</span>
                    </div>
                  </div>

                  {/* Dual columns for Approve users and Disputes claims */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Approve technicians channel */}
                    <div className="bg-white/5 backdrop-blur-md rounded-[28px] p-6 border border-white/10">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-300 font-mono mb-4">Awaiting Technician Credentials Approval</h3>
                      
                      <div className="space-y-3">
                        {pendingTechs.length === 0 ? (
                          <div className="text-center p-6 text-slate-400 text-xs">No pending technician approvals found.</div>
                        ) : (
                          pendingTechs.map(pt => (
                            <div key={pt.id} className="bg-slate-900/40 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white font-mono">{pt.initials}</div>
                                <div>
                                  <span className="text-xs font-bold text-white block">{pt.name}</span>
                                  <span className="text-[9.5px] text-slate-400 font-mono font-bold">{pt.region}</span>
                                </div>
                              </div>
                              <button onClick={() => { handleApproveTech(pt.id, pt.name); }} className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all">
                                Approve Verify
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Disputes claims channel */}
                    <div className="bg-white/5 backdrop-blur-md rounded-[28px] p-6 border border-white/10">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 font-mono mb-4">HQ Client Dispute Mediation Claims</h3>
                      <div className="space-y-3">
                        {activeDisputes.length === 0 ? (
                          <div className="text-center p-6 text-slate-400 text-xs text-slate-300">All consumer dispute mediation files are resolved and closed.</div>
                        ) : (
                          activeDisputes.map(disp => (
                            <div key={disp.id} className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 text-xs space-y-3">
                              <div className="flex justify-between font-semibold">
                                <span className="text-indigo-300 font-mono">CLAIM #{disp.id}</span>
                                <span className="text-rose-400">Status: Awaiting Review</span>
                              </div>
                              <p className="text-slate-300 leading-relaxed">
                                "{disp.description}"
                              </p>
                              <div className="flex gap-2 h-auto">
                                <button onClick={() => { handleResolveDispute(disp.id, 'refund', disp.customerName, disp.amount); }} className="flex-1 py-1.5 bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white rounded text-[10px] transition-all font-bold">
                                  Refund Customer
                                </button>
                                <button onClick={() => { handleResolveDispute(disp.id, 'release', disp.customerName, disp.amount); }} className="flex-1 py-1.5 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white rounded text-[10px] transition-all font-bold">
                                  Release to Tech
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. PROFILE & SYSTEM SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-white/10 text-left max-w-xl mx-auto space-y-6">
                  <div>
                    <h1 className="text-xl font-bold text-white font-display">Global Phix.IT Smart Security & Wallet Profile</h1>
                    <p className="text-xs text-slate-400">Manage Mobile Money escrow numbers, verification documents, and active user roles.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 space-y-3.5 text-xs">
                      <h3 className="font-bold text-white">Interactive Wallet Preference</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setAuthForm(prev => ({ ...prev, momoProvider: 'mtn' }))}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                            authForm.momoProvider === 'mtn' ? 'border-amber-400 bg-amber-400/10' : 'border-white/5 hover:bg-white/5'
                          }`}
                        >
                          <div>
                            <span className="block font-bold text-white text-xs">MTN MoMo</span>
                            <span className="text-[9px] text-slate-400 uppercase font-mono">024 / 054 / 059 Prefixes</span>
                          </div>
                          {authForm.momoProvider === 'mtn' && <span className="text-amber-400">🟡</span>}
                        </button>

                        <button
                          onClick={() => setAuthForm(prev => ({ ...prev, momoProvider: 'telecel' }))}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                            authForm.momoProvider === 'telecel' ? 'border-red-400 bg-red-400/10' : 'border-white/5 hover:bg-white/5'
                          }`}
                        >
                          <div>
                            <span className="block font-bold text-white text-xs">Telecel Cash</span>
                            <span className="text-[9px] text-slate-400 uppercase font-mono">Vodafone Ghana channel</span>
                          </div>
                          {authForm.momoProvider === 'telecel' && <span className="text-red-400">🔴</span>}
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-semibold block">Primary Payment Prompt Phone Number</label>
                        <input
                          type="text"
                          value={currentUser.phone}
                          onChange={(e) => setCurrentUser(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full bg-[#0d0726] border border-white/10 rounded-xl px-4 py-2 text-white font-mono font-bold focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 space-y-2 text-xs">
                      <h3 className="font-bold text-white">Sustained African Localized Currencies</h3>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        Global Phix.IT is built to default transactions automatically relative to region: GHS (Ghana Cedis), NGN (Nigerian Naira) and KES (Kenyan Shillings). Balance changes update live logs.
                      </p>
                    </div>

                    <button
                      onClick={() => showToast("Profile update successfully saved! Standard USSD prompts are configured to trigger automatically on transaction commands.")}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow"
                    >
                      Save Secure Wallet profile Update
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </main>

      {/* 8. ACTIVE SELECTED TICKET INTEGRATION MODAL (Support Channels, stage history & MoMo escrow payment panel) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" id="selected-ticket-modal">
          <div className="bg-slate-900/90 border border-white/10 rounded-[32px] max-w-4xl w-full p-6 space-y-6 text-left relative shadow-2xl animate-scale-in">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>

            {/* upper header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-indigo-300 font-bold bg-indigo-500/20 px-2.5 py-0.5 rounded-lg">{selectedTicket.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    selectedTicket.paymentStatus === 'Fully Paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>{selectedTicket.paymentStatus}</span>
                </div>
                <h2 className="text-xl font-bold text-white font-display">{selectedTicket.brand} {selectedTicket.model} Diagnostics Log</h2>
                <p className="text-xs text-slate-400">Created by {selectedTicket.customerName} on {selectedTicket.createdAt.split('T')[0]}</p>
              </div>

              {/* Action payment trigger */}
              {selectedTicket.paymentStatus !== 'Fully Paid' && (
                <div className="bg-slate-950 rounded-2xl p-4 border border-white/5 flex items-center gap-4 shrink-0">
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 uppercase font-mono font-bold block">Current Invoice balance</span>
                    <span className="text-lg font-black text-white">GH₵ {selectedTicket.finalPrice || selectedTicket.priceEstimate?.min || 150}.00</span>
                  </div>
                  <button
                    onClick={() => triggerMomoPayment(selectedTicket.id, selectedTicket.finalPrice || selectedTicket.priceEstimate?.min || 150)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all uppercase"
                    id="momo-pay-modal-btn"
                  >
                    Settle via MoMo
                  </button>
                </div>
              )}
            </div>

            {/* Split layout: detail info log vs visual support chat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
              
              {/* Left Column: Diagnostics facts & Visual Stage Updates list */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase font-mono block">Problem Statement Description</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3.5 rounded-2xl border border-white/5 italic">
                    "{selectedTicket.description}"
                  </p>
                </div>

                {/* VISUAL REPAIR TIMELINE STAGE FLOW */}
                <div className="space-y-3">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase font-mono block">Visual Operations Timeline Logs</span>
                  <div className="space-y-2 relative pl-4 border-l border-white/10 ml-2">
                    {selectedTicket.stageHistory.map((history, idx) => (
                      <div key={idx} className="relative text-xs">
                        <span className="absolute -left-[20.5px] top-1.5 w-2 h-2 rounded-full bg-indigo-400"></span>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span>{history.timestamp.split('T')[0]} • {history.timestamp.split('T')[1]?.substring(0,5) || ''}</span>
                        </div>
                        <p className="font-bold text-slate-100">{history.stage}</p>
                        {history.notes && <p className="text-[11px] text-indigo-200 mt-0.5">{history.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating trigger if successfully completed but no rating yet */}
                {selectedTicket.stage === 'Completed' && !selectedTicket.rating && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2.5">
                    <p className="text-xs text-slate-200 font-bold">How was your service experience with technician?</p>
                    <button
                      onClick={() => triggerRatingModal(selectedTicket.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                    >
                      ⭐ Submit Review Feedback Rating
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: In-App Direct Instant Chat channel with professional */}
              <div className="bg-slate-950/40 rounded-3xl p-4 border border-white/5 flex flex-col justify-between h-[340px]">
                <div className="text-xs border-b border-white/5 pb-2.5 flex justify-between items-center bg-slate-950/10 mb-2">
                  <span className="font-bold text-slate-200 tracking-wider">Direct Micro-Technician Support Channel</span>
                  <span className="text-[9px] text-emerald-400 font-mono">Secured Terminal</span>
                </div>

                {/* Chats view list */}
                <div className="flex-1 overflow-y-auto space-y-2.5 p-2">
                  {chats
                    .filter(c => c.ticketId === selectedTicket.id)
                    .map(msg => {
                      const isMe = msg.senderRole === currentUser.role;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                            isMe ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-200'
                          }`}>
                            <p>{msg.text}</p>
                          </div>
                          <span className="text-[8px] text-slate-500 mt-0.5">{msg.senderName}</span>
                        </div>
                      );
                    })}
                </div>

                {/* Chats Form Input */}
                <form 
                  onSubmit={(e) => handleSendChat(e, selectedTicket.id)} 
                  className="mt-3 flex gap-2"
                >
                  <input
                    type="text"
                    required
                    value={chatInputs}
                    onChange={(e) => setChatInputs(e.target.value)}
                    placeholder="Enter chat reply message..."
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button type="submit" className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-slate-700 select-none">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 9. SECURE MTN / TELECEL MOBILE MONEY PAYMENT GATEWAY USSD PUSH PROMPT MODAL */}
      {momoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-[32px] p-6 max-w-sm w-full text-center space-y-6 shadow-2xl animate-bounce-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">MTN MoMo API Simulator</span>
              <button onClick={() => setMomoModal(null)} className="p-1 rounded bg-slate-100 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {momoModal.status === 'prompt-sending' && (
              <div className="space-y-4 py-8">
                <div className="w-16 h-16 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mx-auto"></div>
                <h3 className="text-base font-bold text-slate-800">Triggering MoMo USSD prompt</h3>
                <p className="text-xs text-slate-500">Communicating with secure telecommunication gateways for GH₵ {momoModal.amount}.50...</p>
              </div>
            )}

            {momoModal.status === 'user-input' && (
              <div className="space-y-4 text-left">
                <div className="bg-amber-100 p-4 rounded-2xl flex items-center gap-3">
                  <span className="text-2xl">📲</span>
                  <div>
                    <span className="font-black text-slate-800 text-sm block">MTN MoMo Pay Request Received</span>
                    <span className="text-xs text-slate-600">Merchant Code: GLOBALPHIX_MGMT</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs">
                  <p className="font-bold text-slate-700">Visual Simulated Prompt on user's phone:</p>
                  <div className="border border-slate-200 bg-slate-950 text-emerald-400 p-3 rounded font-mono text-[11px] space-y-2">
                    <p>Global Phix.IT GHS Terminal:</p>
                    <p>"Do you wish to authorize GH₵ {momoModal.amount}.50 GHS deposit to Global Phix.IT Specialised Labs?"</p>
                    <div className="flex gap-2 text-white">
                      <span>1) Confirm PIN</span>
                      <span>2) Cancel</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setMomoModal(prev => prev ? { ...prev, status: 'failed' } : null)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Cancel Settle
                  </button>
                  <button
                    onClick={handleConfirmMomoPrompt}
                    className="flex-1 py-2.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-200"
                  >
                    Authorize Deposit Prompt
                  </button>
                </div>
              </div>
            )}

            {momoModal.status === 'success' && (
              <div className="space-y-4 py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                <h3 className="text-base font-bold text-slate-800">Authorization Verified</h3>
                <p className="text-xs text-slate-500">We received your GH₵ {momoModal.amount}.50 deposit transfer successfully. Digital escrow is secured dynamically.</p>
                <button
                  onClick={() => setMomoModal(null)}
                  className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

            {momoModal.status === 'failed' && (
              <div className="space-y-4 py-6">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">!</div>
                <h3 className="text-base font-bold text-slate-800">USSD Settle Timeout / Cancel</h3>
                <p className="text-xs text-slate-500">Authorization was denied by user or telco service. Please confirm MoMo phone status or credentials and try again.</p>
                <button
                  onClick={() => setMomoModal(prev => prev ? { ...prev, status: 'user-input' } : null)}
                  className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Retry Prompt
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9A. TECHNICIAN CONTROLLED DIGITAL INVOICE GENERATOR MODAL */}
      {invoiceModal && invoiceModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-[32px] p-6 max-w-sm w-full text-left space-y-4 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setInvoiceModal(null)}
              className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all"
              aria-label="Close invoice"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white font-display">Issue Digital Invoice</h3>
              <p className="text-xs text-slate-400">Generate an electronic receipt / invoice for {invoiceModal.brand} {invoiceModal.model}.</p>
            </div>

            <div className="space-y-4 pt-1.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider font-mono">Invoice Amount (GHS / GH₵)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono text-xs">GH₵</span>
                  <input
                    type="number"
                    required
                    value={invoiceModal.amount}
                    onChange={(e) => setInvoiceModal(prev => prev ? { ...prev, amount: e.target.value } : null)}
                    placeholder="e.g. 150"
                    className="w-full bg-[#0d0726] border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-white font-mono font-bold focus:border-indigo-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl">
                <p className="text-[10px] text-indigo-300 leading-relaxed">
                  ⚠️ This digital invoice will immediately trigger a live USSD payment prompt notification on the customer's phone and secure money via our unified Mobile Money Escrow channel.
                </p>
              </div>

              <div className="flex gap-2 pt-1 h-auto font-sans">
                <button
                  onClick={() => setInvoiceModal(null)}
                  className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const amountVal = Number(invoiceModal.amount) || 150;
                    handleGenerateInvoice(invoiceModal.ticketId, amountVal);
                    setInvoiceModal(null);
                  }}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-transform active:scale-[0.98] shadow-lg shadow-indigo-600/20"
                >
                  Publish Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. CLIENT SERVICE STAR REVIEW DETAILS POPUP */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-[32px] p-6 max-w-sm w-full text-left space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-display">Rate Your Repair Service</h3>
            <p className="text-xs text-slate-400">Your genuine reviews build immediate local reputation for Accra Central specialists.</p>

            <div className="flex gap-2 justify-center py-2.5">
              {[1, 2, 3, 4, 5].map(starNum => (
                <button
                  key={starNum}
                  onClick={() => setReviewModal(prev => prev ? { ...prev, rating: starNum } : null)}
                  className="text-2xl"
                >
                  <Star className={`w-8 h-8 ${starNum <= reviewModal.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-slate-300 font-semibold block">
                Describe your experience with {tickets.find(t => t.id === reviewModal.ticketId)?.technicianName || 'the technician'}
              </label>
              <textarea
                value={reviewModal.text}
                onChange={(e) => setReviewModal(prev => prev ? { ...prev, text: e.target.value } : null)}
                placeholder="He was extremely fast, sourced the premium LCD panel instantly and verified pin parameters beautifully."
                rows={3}
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-white"
              />
            </div>

            <div className="flex gap-2 pt-2 h-auto">
              <button onClick={() => setReviewModal(null)} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300">
                Skip
              </button>
              <button onClick={submitReviewRating} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-505 text-white rounded-xl text-xs font-bold">
                Submit Review Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOAT SMART CONTEXT CHATBOT ASSISTANT */}
      <AIChatbot currentRole={currentUser.role} />

      {/* 11. IN-APP INTERACTIVE TOAST BANNERS */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] bg-gradient-to-r from-purple-600 to-indigo-600 border border-white/10 text-white font-semibold text-xs py-3.5 px-6 rounded-2xl shadow-2xl flex items-center gap-2.5 max-w-sm">
          <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0"></span>
          <span className="flex-1">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-2 px-1.5 py-0.5 rounded text-sm hover:bg-white/10 transition-colors">×</button>
        </div>
      )}
    </div>
  );
}
