# VibePPC Command Center
## Project Constitution

**Version:** 1.0  
**Last Updated:** April 15, 2026  
**Status:** Foundation Document

---

## Mission Statement

VibePPC Command Center is a premium, cross-platform Progressive Web Application (PWA) that empowers Amazon sellers—from newcomers to seasoned professionals—with AI-driven intelligence to optimize advertising spend, enhance content strategy, and predict business outcomes with confidence.

**Core Promise:** Transform PPC complexity into actionable clarity in under 5 minutes daily.

---

## Core Pillars

### 1. Financial Clarity
Deliver transparent, real-time insights into advertising performance metrics (ROAS, TACoS, Wasted Spend) that enable sellers to make informed budget decisions without drowning in spreadsheets.

### 2. PPC Actionability
Surface bleeding keywords and provide intelligent bid optimization recommendations that sellers can act on immediately—with full transparency on why each recommendation matters.

### 3. Content Strategy
Guide sellers in crafting SEO-optimized listings, compelling bullet points, and competitive positioning through data-driven analysis and AI-powered suggestions.

### 4. Predictive Intelligence
Leverage AI to forecast future losses and gains, enabling proactive strategy adjustments rather than reactive firefighting. Predict budget needs before running out.

---

## Vibe Coding Principles

### 1. Speed is a Feature
**Principle:** Every interaction should feel instant. Every task should complete in under 2 minutes.

- Target <2s page load on 3G connections
- Optimize for perceived performance (skeleton screens, optimistic updates)
- Use Web Workers for heavy processing to keep UI responsive
- Implement aggressive caching strategies
- Virtual scrolling for large datasets (100K+ rows)

**Why it matters:** Sellers check metrics multiple times daily. Slow = abandoned. Speed builds trust.

### 2. Clarity Over Complexity
**Principle:** Every feature must reduce cognitive load, not increase it.

- Present data in digestible chunks with clear visual hierarchy
- Avoid jargon unless it's industry-standard Amazon terminology
- Provide contextual help without cluttering the interface
- Default to simple views with progressive disclosure for advanced features
- Use the "1-2 minute rule" from Mercury: any task should complete in under 2 minutes

**Why it matters:** Amazon sellers are overwhelmed with data. Our value is in making complexity simple.

### 3. Action-Oriented Intelligence
**Principle:** Insights without action are noise. Every data point should lead to a clear next step.

- Prioritize recommendations by impact and urgency
- Enable one-click actions where possible (bid adjustments, keyword pausing)
- Show the "why" behind every recommendation with confidence scores
- Provide "what-if" scenario modeling
- Always offer undo capabilities for confidence

**Why it matters:** Sellers need to move fast. Analysis paralysis costs money.

### 4. Transparent AI
**Principle:** AI recommendations must be explainable and verifiable. No black boxes.

- Always show the data sources behind AI conclusions
- Provide confidence scores for predictions (0-100%)
- Allow users to drill down into calculation methodologies
- Never hide uncertainty—communicate it clearly
- Learn from user decisions to improve suggestions

**Why it matters:** Sellers are risking real money. They need to trust the system before they act. Research shows Helium 10's success comes from customizable rules, not black-box automation.

### 5. Inclusive Expertise
**Principle:** Serve both the novice and the expert without compromise.

- Provide guided workflows for beginners
- Offer advanced controls and bulk operations for pros
- Use progressive disclosure to hide complexity until needed
- Maintain consistent patterns that scale with user growth
- Smart defaults that work for 80% of sellers

**Why it matters:** Today's newbie is tomorrow's power user. The platform should grow with them.

### 6. Data Integrity First
**Principle:** Accuracy trumps speed. Wrong data is worse than no data.

- Validate all imported data against expected schemas
- Surface data quality issues prominently
- Maintain audit trails for all calculations
- Implement reconciliation checks against Amazon's source data
- Never silently fail—always inform the user

**Why it matters:** A single miscalculated ROAS can lead to catastrophic budget decisions. Research shows Helium 10 commands premium pricing partly due to 38.2% data accuracy vs competitors' 29.5%.

### 7. Privacy & Security by Design
**Principle:** User data is sacred. Security is not optional.

- Zero-trust architecture (assume every component can be compromised)
- Encrypt sensitive data at rest (AES-256) and in transit (TLS 1.3+)
- Never expose API keys client-side
- Implement row-level access controls
- Audit logging for all sensitive operations
- GDPR/CCPA compliance from day one

**Why it matters:** Amazon credentials are the keys to sellers' businesses. One breach destroys trust forever.

---

## User Experience Standards

### Design Philosophy: "Obsidian & Emerald"

**Premium Dark Mode by Default**
- Primary background: `#0a0a0a` (Obsidian Black)
- Secondary background: `#1a1a1a` (Charcoal)
- Accent color: `#10b981` (Emerald 500)
- Success states: `#34d399` (Emerald 400)
- Warning states: `#fbbf24` (Amber 400)
- Danger states: `#ef4444` (Red 500)
- Text primary: `#f9fafb` (Gray 50)
- Text secondary: `#d1d5db` (Gray 300)
- Borders: `#374151` (Gray 700)

**Why Obsidian & Emerald:**
- Reduces eye strain for users monitoring dashboards for extended periods
- Emerald green signals growth, profit, and positive action
- Premium aesthetic differentiates from competitors' generic dark modes
- High contrast ensures WCAG AA accessibility compliance

### Responsive Design Requirements

#### Mobile-First Approach (320px - 768px)
- Single-column layouts with collapsible sections
- Touch targets minimum 44x44px
- Bottom navigation for primary actions
- Swipe gestures for common actions (archive, refresh)
- Critical metrics visible without scrolling
- Simplified charts optimized for small screens

#### Desktop Experience (1024px+)
- Multi-column dashboards with customizable layouts
- Keyboard shortcuts for power users (document in UI)
- Hover states for additional context
- Side-by-side comparison views
- Bulk action capabilities
- Drag-and-drop for campaign organization

#### Tablet Optimization (768px - 1024px)
- Hybrid layouts that adapt to orientation
- Support for split-screen multitasking
- Optimized for landscape dashboard viewing
- Touch-friendly with keyboard support

### Interaction Patterns

#### Loading States
- Skeleton screens for predictable content structures
- Progress indicators for long-running AI operations (with time estimates)
- Optimistic UI updates with rollback on failure
- Background sync with visual confirmation
- Never block the UI—use Web Workers for heavy processing

#### Error Handling
- Errors are opportunities to educate, not dead ends
- Provide specific, actionable error messages
- Offer recovery paths (retry, alternative actions, contact support)
- Never blame the user—assume system failure first
- Log errors silently for debugging, show friendly messages to users

#### Feedback Loops
- Immediate visual feedback for all interactions (<100ms)
- Success confirmations that don't interrupt flow (toast notifications)
- Undo capabilities for destructive actions (30-second window)
- Toast notifications for background operations
- Haptic feedback on mobile for important actions

### Accessibility Commitments
- WCAG 2.1 AA compliance minimum (AAA for critical paths)
- Keyboard navigation for all features
- Screen reader optimization with ARIA labels
- Color is never the only indicator of state
- Respect user motion preferences (prefers-reduced-motion)
- Font size minimum 16px, scalable to 200%
- Focus indicators clearly visible

### Content Voice
- **Tone:** Confident but not arrogant, helpful but not condescending
- **Language:** Direct and concise—respect the user's time
- **Terminology:** Use Amazon's language (ASIN, SKU, Campaign) consistently
- **Numbers:** Always format currency, percentages, and dates according to user locale
- **Explanations:** "We recommend this because..." not "You should..."

---

## Data Security & Privacy Rules

### Principle: Zero-Trust Architecture
Assume every component can be compromised. Design accordingly.

### Data Classification

#### Tier 1: Critical Sensitive Data
- Amazon API credentials (MWS/SP-API tokens)
- User authentication tokens
- Payment information

**Requirements:**
- Encrypted at rest (AES-256)
- Encrypted in transit (TLS 1.3+)
- Never logged, even in error states
- Stored in Google Secret Manager
- Rotated automatically every 90 days
- Access audited and monitored

#### Tier 2: Business Sensitive Data
- PPC campaign data
- Sales figures and revenue metrics
- Competitor analysis results
- Predictive model outputs

**Requirements:**
- Encrypted at rest and in transit
- Row-level access controls
- Audit logging for all access
- Retention policies enforced (7 years for financial data)
- Anonymized in non-production environments

#### Tier 3: Operational Data
- User preferences
- UI state
- Feature flags
- Analytics events

**Requirements:**
- Encrypted in transit
- Aggregated and anonymized for analytics
- No PII in logs or analytics
- User-controlled deletion

### Authentication & Authorization

#### Authentication Standards
- Multi-factor authentication (MFA) required for all accounts
- OAuth 2.0 / OpenID Connect for third-party integrations
- Session timeout: 30 minutes of inactivity
- Refresh token rotation on every use
- Device fingerprinting for anomaly detection

#### Authorization Model (RBAC)
- **Owner:** Full access, billing, user management
- **Admin:** All features, no billing
- **Analyst:** Read + limited actions (bid adjustments, keyword pausing)
- **Viewer:** Read-only access

### API Security

#### Gemini AI Integration
- Never send Tier 1 data to external AI services
- Anonymize/pseudonymize Tier 2 data before AI processing
- Implement content filtering for AI inputs/outputs
- Rate limiting and cost controls per user
- Fallback mechanisms if AI service is unavailable

#### Amazon SP-API Integration
- Store credentials per-user, never shared
- Implement rate limiting to respect Amazon's quotas
- Retry logic with exponential backoff
- Validate all responses against expected schemas
- Fail closed—if validation fails, don't process data

### Client-Side Security

#### PWA Security
- Content Security Policy (CSP) headers enforced
- Subresource Integrity (SRI) for all external resources
- No inline scripts or styles
- Service worker security best practices
- Secure storage using Web Crypto API for sensitive client data

#### Data Handling
- Minimize data stored in browser (session storage preferred over local storage)
- Clear sensitive data on logout
- Implement client-side encryption for cached sensitive data
- No sensitive data in URL parameters or query strings

### Incident Response Protocol

1. **Immediate (0-1 hour):** Isolate affected systems, revoke compromised credentials
2. **Within 24 hours:** Assess scope, notify security team, begin investigation
3. **Within 72 hours:** Notify affected users if breach confirmed, regulatory notification if required
4. **Post-incident:** Root cause analysis, remediation, lessons learned documentation

---

## Success Metrics

### User Success
- Time to first insight: <5 minutes from signup
- Action completion rate: >70% of recommendations acted upon
- User retention: >60% monthly active users after 3 months
- NPS score: >50
- Average session duration: 5-10 minutes (efficient, not addictive)

### Technical Success
- Uptime: 99.9% (excluding planned maintenance)
- P95 page load time: <2 seconds
- AI recommendation accuracy: >85% (validated against actual outcomes)
- Zero critical security incidents
- CSV parsing: <10 seconds for 50MB files

### Business Success
- Average wasted spend reduction: >20% within first month
- User-reported ROI: >5x platform cost
- Feature adoption: >40% of users use 3+ core features monthly
- Customer acquisition cost (CAC) < 3 months LTV

---

## Governance

### Decision-Making Framework
- **Lead Architect:** Final say on technical architecture and security
- **User Research:** Validates all UX decisions with real seller feedback
- **Security Review:** Required for all features touching Tier 1/2 data
- **Performance Budget:** No feature ships if it degrades core metrics

### Change Management
- All changes to this constitution require documented rationale
- Major changes (mission, core pillars) require stakeholder consensus
- Version control this document alongside codebase
- Review quarterly for relevance and updates

---

## Market Differentiation

Based on competitive research (Helium 10, Jungle Scout, Mercury), VibePPC differentiates through:

1. **Predictive Intelligence:** Forecast budget needs, keyword trajectories, seasonal trends (market gap)
2. **Transparent AI:** Explain every recommendation with confidence scores (vs black-box automation)
3. **Speed Philosophy:** "5 minutes daily" promise (inspired by Mercury's "1-2 minutes for any task")
4. **Simplified Complexity:** Smart defaults, progressive disclosure (vs Helium 10's feature overload)
5. **Flat Pricing:** No percentage of ad spend fees (vs Helium 10's 2% friction)
6. **Mobile-First:** Optimize campaigns on-the-go (market gap)

---

## Appendix: Definitions

**ROAS (Return on Ad Spend):** Revenue generated per dollar spent on advertising  
**TACoS (Total Advertising Cost of Sale):** Ad spend as percentage of total revenue  
**ACoS (Advertising Cost of Sale):** Ad spend as percentage of ad-attributed revenue  
**Bleeding Keywords:** Search terms with high spend but low/no conversions  
**Progressive Disclosure:** UX pattern that shows advanced features only when needed  
**Optimistic UI:** Update interface immediately, rollback if server rejects  
**Zero-Trust:** Security model that assumes no implicit trust, verifies everything  
**Web Workers:** JavaScript threads for non-blocking heavy processing

---

**Document Status:** Living Document  
**Next Review Date:** July 15, 2026  
**Companion Document:** TECHNICAL_SPECIFICATIONS.md

This constitution is the foundation. All code, designs, and decisions must align with these principles. When in doubt, refer back to the mission and core pillars.