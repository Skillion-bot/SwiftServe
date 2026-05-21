/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'customer' | 'technician' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  avatarUrl: string;
  verified: boolean;
  businessName?: string;
  rating?: number;
  completedJobs?: number;
}

export type ServiceType = 'phone_repair' | 'errands' | 'laundry' | 'cleaning' | 'grocery' | 'logistics';

export interface ServiceDefinition {
  type: ServiceType;
  name: string;
  tagline: string;
  description: string;
  iconName: string;
  basePrice: string;
  active: boolean;
}

export type RepairStage =
  | 'Request Received'
  | 'Diagnosing'
  | 'Repair In Progress'
  | 'Awaiting Parts'
  | 'Ready for Pickup'
  | 'Completed';

export interface StageHistoryEntry {
  stage: RepairStage;
  timestamp: string;
  notes?: string;
}

export interface PriceEstimate {
  min: number;
  max: number;
  label: string;
}

export interface RepairTicket {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  technicianId?: string;
  technicianName?: string;
  serviceType: ServiceType;
  title: string;
  brand: string;
  model: string;
  description: string;
  imageUrls: string[];
  urgency: 'low' | 'medium' | 'high';
  type: 'pickup' | 'walk-in';
  date: string;
  stage: RepairStage;
  stageHistory: StageHistoryEntry[];
  priceEstimate?: PriceEstimate;
  finalPrice?: number;
  paymentStatus: 'Unpaid' | 'Deposit Paid' | 'Fully Paid';
  paymentMethod?: 'momo_mtn' | 'momo_telecel' | 'momo_airteltigo' | 'card';
  momoNumber?: string;
  paymentTransactionId?: string;
  notes?: string;
  rating?: number;
  reviewText?: string;
  reviewDate?: string;
  disputeExplanation?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  imageUrl?: string;
}

export type NotificationType = 'status_update' | 'payment' | 'momo_prompt' | 'new_request' | 'chat' | 'system';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  timestamp: string;
  ticketId?: string;
}

export interface RepairSuggestion {
  possibleIssue: string;
  recommendedRepair: string;
  estimatedCostMin: number;
  estimatedCostMax: number;
  estimatedDuration: string;
  confidence: number;
}

export interface VoiceParsingResponse {
  brand: string;
  model: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  type: 'pickup' | 'walk-in';
  possibleIssue: string;
  suggestedRepair: string;
  estimatedCostMin: number;
  estimatedCostMax: number;
  estimatedDuration: string;
}
