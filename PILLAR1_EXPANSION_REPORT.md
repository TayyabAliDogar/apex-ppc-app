# PILLAR 1 EXPANSION - SPECIFICATION LOCK REPORT

**Date:** April 16, 2026  
**Status:** 🔒 LOCKED - Awaiting Approval  
**File:** `docs/TECH_SPECS_PART2_ZERO_COST.md`  
**Lines Added:** +540 lines (9820 → 10360)

---

## NEW SECTIONS ADDED

### ✅ Section 1.3: The 'Bleeding' Decision Matrix (Actionable Thresholds)

**Purpose:** Define exact, mathematical thresholds for actionable advice.

**Key Components:**
1. **Bleeding Keyword Thresholds** (4 severity levels)
   - 🔴 Critical Bleed: >$50 spend, 0 conversions, 7+ days → PAUSE
   - 🟠 High Bleed: $25-$50, 0 conversions, 5-7 days → Lower bid 40-50%
   - 🟡 Medium Bleed: $10-$25, 0 conversions, 3-5 days → Lower bid 25-30%
   - 🟢 Watch: <$10, 0 conversions, 1-3 days → Monitor only

2. **ACoS Threshold Matrix** (5 profitability bands)
   - 0-20%: Excellent → Scale up (increase bid 10-15%)
   - 21-35%: Good → Maintain
   - 36-50%: Marginal → Lower bid 10-15%
   - 51-75%: Unprofitable → Lower bid 25-30%
   - >75%: Critical Loss → PAUSE or lower 50%

3. **Human-Like Optimization Focus** (From Interview USPs)
   - Main Image Quality Issues (CTR problem = visual problem)
   - Price Point Misalignment (clicks but no sales = price resistance)
   - Negative Keyword Opportunities (intent mismatch = wasted spend)
   - Bid Optimization with specific dollar amounts

4. **Required Advice Format**
   ```
   [Severity Emoji] [PROBLEM STATEMENT]
   Keyword/Campaign: [Exact name]
   Problem: [Specific metrics with dollar amounts]
   Root Cause: [Why this is happening - human reasoning]
   Recommendation: [Exact action with numbers]
   Expected Impact: [Predicted outcome]
   Action: [One-click button] [Alternative action] [Dismiss]
   ```

**Forbidden:** Generic advice like "Consider optimizing" or "Review your keywords"

---

### ✅ Section 1.4: Competitor Sentiment Engine (Senior Consultant Voice)

**Purpose:** Make AI Refine sound like a Senior Amazon Consultant with 10+ years experience.

**Key Components:**
1. **Consultant Persona Characteristics**
   - Tone: Direct, confident, data-driven
   - Language: Amazon-specific (A9 algorithm, Buy Box, conversion funnel)
   - Approach: Root causes, not symptoms
   - Style: Bullet points with numbers, not paragraphs

2. **Competitive Intelligence Database Structure**
   ```javascript
   const COMPETITOR_INTELLIGENCE = {
     topUSPs: [...],
     pricingStrategy: {...},
     weaknesses: [...],
     marketTrends: [...]
   };
   ```

3. **AI Refine Prompt Template**
   - Injects competitor USPs
   - Highlights competitor weaknesses (opportunities)
   - References market trends
   - Demands specific, numbered recommendations

4. **Voice Examples**
   - ✅ Good: "Your title is 47 characters. Amazon's A9 algorithm prioritizes 150-200. Add: material, size, benefit."
   - ❌ Bad: "Consider improving your title to make it more descriptive."

---

### ✅ Iron Rule #6: Atomic Additions Only (Anti-Deletion Safety Lock)

**Purpose:** PREVENT code deletion that caused the black screen incident.

**The Anti-Deletion Oath:**
> "I, Claude (Kiro), solemnly swear that I will NEVER delete, remove, or 'clean up' existing working code without explicit user permission. Every new feature will be implemented as an independent, self-contained module. I will treat existing code as sacred and untouchable. Modification is only permitted through non-destructive hooks and extensions. I acknowledge that deleting code has caused critical failures in the past, and I commit to preventing this from ever happening again."

**Enforcement Rules:**

**Rule 6.1: Zero Deletion Policy**
- Keep old functions, add new ones separately
- Never delete existing logic

**Rule 6.2: Atomic Module Pattern**
- New features in separate files (e.g., `src/lib/bleeding-keyword-detector.js`)
- Import and use alongside existing code
- Never replace existing modules

**Rule 6.3: Non-Destructive Hooks Only**
- Add optional hooks to existing functions
- Never modify core logic
- Existing return values untouched

**Rule 6.4: Feature Flags for Safety**
- New features behind flags
- Can be disabled without breaking existing functionality
- Existing features always on

**Verification Checklist:**
- [ ] No existing functions deleted
- [ ] No existing logic modified
- [ ] New features in separate files
- [ ] New UI components are additive
- [ ] Feature flags implemented
- [ ] Existing tests still pass

**Penalty:** If violated, ALL changes reverted and re-implemented.

---

### ✅ Section 1.5: UI Protection (Emerald Insight Cards)

**Purpose:** Ensure new insights don't overwrite existing UI or user data.

**Key Components:**

1. **Emerald Insight Card Visual Design**
   - Distinct emerald gradient background
   - 2px emerald border with glow effect
   - Emerald badge: "🤖 AI Insight"
   - Never confused with existing cards

2. **Component Structure**
   - Separate `EmeraldInsightCard` component
   - Never modifies existing data
   - Framer Motion animations
   - Action buttons: Apply, Secondary Action, Dismiss

3. **Integration Pattern (Non-Destructive)**
   ```javascript
   function InsightsPage() {
     return (
       <>
         {/* EXISTING UI UNTOUCHED */}
         <ExistingInsightCards />
         
         {/* NEW EMERALD INSIGHTS ADDED BELOW */}
         {bleedingKeywords.length > 0 && (
           <EmeraldInsightCards />
         )}
       </>
     );
   }
   ```

4. **Data Protection Rules**
   - **Rule 5.1:** Read-Only by Default (insights never auto-modify data)
   - **Rule 5.2:** Explicit User Confirmation Required (must click "Apply")
   - **Rule 5.3:** Dismissible & Non-Blocking (can be dismissed, stored in localStorage)

---

## COMPLIANCE VERIFICATION

**All 4 Sections Successfully Added:**
- ✅ Section 1.3: Bleeding Decision Matrix (Lines 68-128)
- ✅ Section 1.4: Competitor Sentiment Engine (Lines 130-255)
- ✅ Iron Rule #6: Atomic Additions Only (Lines 256-380)
- ✅ Section 1.5: UI Protection (Lines 382-606)

**File Integrity:**
- Original file: 9820 lines
- Updated file: 10360 lines
- Lines added: 540 lines
- No existing content deleted
- All previous pillars intact

---

## ANTI-DELETION OATH STATUS

**Oath Text:** Documented in Iron Rule #6 (Line 260-262)

**Awaiting Formal Oath Ceremony:**
The oath has been written into the specs. Formal swearing will occur after user approval of these specifications.

---

## NEXT STEPS

**Before ANY code is written:**
1. ✅ Specs expanded with 4 new sections
2. ⏳ User reviews and approves specs
3. ⏳ Kiro takes Anti-Deletion Oath formally
4. ⏳ User gives explicit permission to begin implementation

**After Approval:**
- Implement Section 1.3: Bleeding Keyword Detector (NEW MODULE)
- Implement Section 1.4: Competitor Sentiment Engine (NEW MODULE)
- Implement Section 1.5: Emerald Insight Card (NEW COMPONENT)
- All implementations follow Iron Rule #6 (Atomic Additions Only)

---

## AWAITING USER APPROVAL

**Status:** 🔒 SPECS LOCKED - NO CODE CHANGES UNTIL APPROVED

The specifications are complete and ready for review. No code will be touched until:
1. User approves these specifications
2. Kiro formally swears the Anti-Deletion Oath
3. User gives explicit go-ahead for implementation
