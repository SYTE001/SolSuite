/**
 * Instant client-side plan limit check for immediate UX feedback.
 * Note: Database triggers (check_user_plan_limits) serve as the authoritative server-side enforcement layer.
 */
export function checkPlanLimits(userPlan, currentUsage) {
  const plan = (userPlan || 'free').toLowerCase();

  const limitsByPlan = {
    free: { clients: 3, invoices: 5, proposals: 3 },
    starter: { clients: 15, invoices: 30, proposals: 20 }
  };

  if (plan === 'pro') {
    return {
      canAddClient: true,
      canAddInvoice: true,
      canAddProposal: true
    };
  }

  // Unknown plans are treated as Free so an invalid value never grants premium access.
  const limits = limitsByPlan[plan] || limitsByPlan.free;
  return {
    canAddClient: (currentUsage?.clientsCount || 0) < limits.clients,
    canAddInvoice: (currentUsage?.invoicesCount || 0) < limits.invoices,
    canAddProposal: (currentUsage?.proposalsCount || 0) < limits.proposals
  };
}
