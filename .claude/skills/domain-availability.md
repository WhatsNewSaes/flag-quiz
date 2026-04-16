# Domain Availability Checker

Check if domain names are available for registration using Namecheap.

## When to Use

- User needs to find an available domain name
- User wants to check multiple domain name ideas
- User is brainstorming names for a project/product/course

## How It Works

Use Playwright to check domain availability on Namecheap:

1. Navigate to: `https://www.namecheap.com/domains/registration/results/?domain={domain_name_without_tld}`
2. Wait 2 seconds for results to load
3. Check the page snapshot for availability status

## Reading Results

**Available domains show:**
- Price (e.g., "$11.28/yr")
- "Add to cart" button
- Promo codes like "$6.49 WITH NEWCOM649"

**Taken domains show:**
- "Taken" label
- "Make offer" button instead of "Add to cart"

**Premium domains show:**
- "Premium" label
- High price (e.g., "$2,999.00")

## Example Workflow

```
1. User: "Help me find a domain for my AI course"

2. Brainstorm name ideas first (don't check yet)

3. Check each promising .com domain:
   - Navigate to Namecheap URL with domain name
   - Wait 2 seconds
   - Read snapshot for status

4. Compile results:
   - Available .com domains with prices
   - Taken domains
   - Alternative TLDs if .com is taken (.ai, .dev, .io, .app)

5. Make recommendations based on:
   - Availability
   - Price
   - Memorability
   - Relevance to the project
```

## Common TLD Pricing (approximate)

- .com - $11-15/yr
- .ai - $80/yr (2-year minimum)
- .io - $35/yr
- .dev - $13/yr (requires HTTPS)
- .app - $13/yr (requires HTTPS)
- .co - $30/yr

## Tips

- Check .com first - it's the most trusted
- If .com is taken, .ai is good for AI-related projects
- .dev and .io work well for technical audiences
- Avoid obscure TLDs (.xyz, .club) for professional use
- Watch for "Premium" domains - they're technically available but expensive
