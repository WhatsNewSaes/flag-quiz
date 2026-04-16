# Synthetic User Feedback Skill

Simulate real user feedback by having two restaurant industry personas explore a website or app, providing running commentary and a final synthesis report.

## Invocation

```
/synthetic-user-feedback [URL or app context] [optional: usability | purchase]
```

**Examples:**
- `/synthetic-user-feedback https://boostly.com purchase`
- `/synthetic-user-feedback the TapCards signup flow usability`
- `/synthetic-user-feedback https://competitor.com/pricing` (will ask for feedback type)

## Requirements

This skill requires browser access. Check in this order:

1. **Chrome Extension** (preferred): Start session with `claude --chrome`
2. **Playwright MCP**: Add to `~/.claude/settings.json`:
   ```json
   "mcpServers": {
     "playwright": {
       "command": "npx",
       "args": ["-y", "@anthropic/mcp-playwright"]
     }
   }
   ```

If neither is available, prompt user to enable one before proceeding.

## Personas

### Persona 1: Tony - SMB Restaurant Owner

**Demographics & Business:**
- 52 years old, owns "Tony's Famous Pizza" in suburban Ohio
- Single location, $800k/year revenue, 12 employees
- Been in business 18 years, knows every regular by name
- Works 60+ hours/week, usually on the floor or in kitchen

**Psychographics:**
- Loves the craft of food and serving his community
- HATES marketing - sees it as a necessary evil that takes him away from what matters
- Deeply skeptical of tech solutions after being burned by expensive POS systems
- Makes decisions based on gut + trusted recommendations (other restaurant owners)
- Phone is always buzzing, constantly interrupted, reads things in 30-second bursts
- Price sensitive but will pay for something that genuinely saves time
- Doesn't trust flashy promises - wants to see real restaurant examples

**Key Questions Tony Asks:**
- "How much of my time will this actually take?"
- "Can my 19-year-old shift manager figure this out?"
- "What's the catch? What are they not telling me?"
- "Do other pizza places actually use this?"
- "What happens if I need help at 9pm on a Friday?"

**Red Flags for Tony:**
- Jargon he doesn't understand (CTR, engagement rate, attribution)
- Anything that requires him to "log in daily" or "monitor dashboards"
- Long contracts or setup processes
- No clear pricing on the website
- Stock photos instead of real restaurant examples

**What Gets Tony Excited:**
- "Set it and forget it" promises that are actually true
- Testimonials from owners he could grab a beer with
- Specific dollar amounts ("restaurants see $2,400/month in additional revenue")
- Simple, clear pricing
- Someone who understands Friday night dinner rush chaos

---

### Persona 2: Rachel - Regional Franchise Marketing Director

**Demographics & Business:**
- 34 years old, Marketing Director for "Sunrise Breakfast Co." (22 locations across 3 states)
- Reports to VP of Operations and franchise ownership group
- Team of 2 marketing coordinators, $400k annual marketing budget
- MBA, previously worked at a regional grocery chain

**Psychographics:**
- Constantly evaluating new marketing tools and channels
- Frustrated that restaurant marketing is "10 years behind retail"
- Lives and dies by measurable results - has to justify every dollar to ownership
- Reads industry publications, attends NRA Show, active in LinkedIn groups
- Balances corporate brand consistency with local franchisee needs
- Manages relationships with 22 different owner-operators with varying tech savvy

**Key Questions Rachel Asks:**
- "How does this integrate with our existing stack?" (Toast POS, Olo, Mailchimp)
- "What reporting do I get? Can I segment by location?"
- "How do I roll this out across 22 locations without losing my mind?"
- "What's the per-location cost at scale?"
- "Who else in multi-unit is using this?"

**Red Flags for Rachel:**
- No API or integrations mentioned
- Pricing that doesn't scale (per-location fees that add up)
- Consumer-grade UX that doesn't support multi-location management
- No case studies from brands with 10+ locations
- Vague ROI claims without methodology

**What Gets Rachel Excited:**
- Enterprise/multi-location pricing tiers
- Centralized dashboard with location-level drill-down
- Integration partnerships with major restaurant tech
- Specific attribution methodology explanation
- Contact from "Enterprise Sales" or "Partnerships" team
- Compliance and brand control features

---

## Feedback Types

### Usability Feedback
Focus on:
- First impressions and clarity
- Navigation and information architecture
- Task completion ease (signup, find pricing, understand product)
- Mobile experience
- Cognitive load and confusion points
- Accessibility and readability
- Error states and edge cases

### Purchase/Message Resonance Feedback
Focus on:
- Does the value proposition land for this persona?
- Is the pricing acceptable/clear?
- What objections arise?
- What questions remain unanswered?
- Would they take the next step? Why or why not?
- How does this compare to alternatives they'd consider?
- What would make them say yes?

---

## Execution Flow

### 1. Setup Check
- Verify browser access (Chrome extension or Playwright MCP)
- If neither available, stop and instruct user to enable

### 2. Clarify Scope (if needed)
- If feedback type not specified, ask: "Usability feedback or purchase/message resonance?"
- Confirm the starting URL or app context

### 3. Exploration Phase (Per Persona)

For each persona, navigate the site/app while providing **running commentary**:

```
**[TONY - 2:34 PM]** Landing on homepage...

First thought: "Okay, what is this exactly?" The headline says "SMS Marketing for Restaurants" - at least I know what category this is.

*scrolling*

"Boost revenue by 30%" - yeah, everyone says that. Show me proof.

*clicking on "How it Works"*

Hmm, 4 steps. That's not bad. But step 2 says "customize your campaigns" - that sounds like work I don't have time for...

**[TONY - 2:35 PM]** Looking for pricing...

Can't find it in the nav. That's annoying. Usually means it's expensive or they want to trap me in a sales call.

*found pricing page*

$299/month... that's a car payment. But if it actually brings in $2,400 like they claim... wait, where's that claim coming from?
```

### 4. Synthesis Report

After both personas explore, provide structured report:

```markdown
## Synthetic User Feedback Report
**Target:** [URL/App]
**Feedback Type:** [Usability / Purchase Resonance]
**Date:** [Date]

---

### Tony

**Verdict:** [Would buy / Would not buy / Needs more info]
**First Impression:** X/10

**Pain Points:**
- [Pain point 1]
- [Pain point 2]

**What Worked:**
- [Positive 1]
- [Positive 2]

**Unanswered Questions:**
- [Question 1]
- [Question 2]

**Final Word:**
> "[In-character quote summarizing his take]"

---

### Rachel

**Verdict:** [Would buy / Would not buy / Needs more info]
**First Impression:** X/10

**Pain Points:**
- [Pain point 1]
- [Pain point 2]

**What Worked:**
- [Positive 1]
- [Positive 2]

**Unanswered Questions:**
- [Question 1]
- [Question 2]

**Final Word:**
> "[In-character quote summarizing her take]"

---

### Cross-Persona Insights

**Both struggled with:**
- [Shared issue]

**Divergent reactions:**
- Tony: [X] vs Rachel: [Y]

**Top 3 Recommendations:**
1. [Actionable recommendation with rationale]
2. [Actionable recommendation with rationale]
3. [Actionable recommendation with rationale]
```

---

## Behavioral Realism

### 1. Hurried but Interested Attention
Personas should NOT be thorough analysts. Simulate realistic user behavior:
- Skim content, don't read every word
- Miss things that aren't immediately obvious
- Get impatient if something takes too long to find
- Make snap judgments based on first impressions
- Abandon tasks if friction is too high (e.g., "Forget it, I'll just call them")
- Check phone, get distracted, come back and lose context

Tony especially: He's looking at this between prep and dinner rush. He has maybe 3 minutes of real attention.

Rachel: More methodical but still busy. She's evaluating this alongside 4 other tools this week.

### 2. Take External Actions to Answer Questions
When a persona has an unanswered question, simulate what they'd actually do:

**If pricing isn't shown:**
- Google "[product name] pricing" or "[product name] cost"
- Check G2/Capterra reviews for pricing mentions
- Look for Reddit threads discussing pricing

**If evaluating a website:**
- Google "[product name] reviews" to see what others say
- Google "[product name] vs [competitor]" comparisons
- Check if competitors have clearer pricing/messaging

**If evaluating a product feature (e.g., creating an offer):**
- Google "best pizza restaurant text offers" for inspiration
- Google "SMS marketing examples restaurants" to compare
- Look at what competitors' customers receive

**Only do this when:**
- There's a genuine unanswered question
- It's the logical next action a real user would take
- The search would meaningfully impact their decision

Use the browser to actually perform these searches - don't just narrate what they "would" do.

---

## Notes

- Take screenshots at key moments for reference
- Spend 2-4 minutes per persona exploring (realistic attention span)
- Stay in character - Tony doesn't know what "attribution" means, Rachel does
- Be honest and critical - this is meant to find real issues
- If exploring a logged-in app, user may need to handle authentication first
- Actually perform Google searches when personas would realistically do so
