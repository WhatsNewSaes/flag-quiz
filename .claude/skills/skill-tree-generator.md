# Skill Tree Generator

Generate skill tree data as JSON files. The viewer at `skill-trees/` dynamically loads and displays skill trees from JSON.

## When to Use

When the user asks you to:
- Create a skill tree for a topic
- Generate a learning path visualization
- Build a knowledge hierarchy
- Create a tech tree or progression system

## How to Generate

1. **Create a JSON file** in `skill-trees/data/[topic-name].json`
2. **Add to index** in `skill-trees/data/index.json`
3. **View** at `skill-trees/?tree=[topic-name].json`

---

## JSON Structure

```json
{
  "id": "topic-name",
  "title": "Topic Name Skill Tree",
  "description": "Brief description of this skill tree",
  "achievements": { ... },
  "categories": [
    { "name": "Category 1", "color": "var(--accent-green)", "id": "category1" },
    { "name": "Category 2", "color": "var(--accent-blue)", "id": "category2" }
  ],
  "treeStructure": { ... },
  "nodeData": { ... },
  "skillData": { ... }
}
```

### Available Colors
- `var(--accent-green)` - Green (#3fb950)
- `var(--accent-blue)` - Blue (#388bfd)
- `var(--accent-purple)` - Purple (#a371f7)
- `var(--accent-orange)` - Orange (#d29922)
- `var(--accent-cyan)` - Cyan (#58a6ff)
- `var(--accent-magenta)` - Magenta (#f778ba)
- `var(--accent-red)` - Red (#f85149)
- `var(--accent-yellow)` - Yellow (#e3b341)

---

## Data Structures

### 0. achievements (The Gauntlet)

Achievements are unlocked when all skills in a category are completed. They appear as collectible gems in the "Gauntlet" UI in the top-right corner. When earned, a celebration animation plays.

```json
{
  "achievements": {
    "category1": {
      "id": "category1-master",
      "title": "Category Master",
      "icon": "🏆",
      "description": "Completed all skills in Category 1",
      "gemColor": "#3fb950"
    },
    "category2": {
      "id": "category2-master",
      "title": "Expert Title",
      "icon": "💎",
      "description": "Mastered all Category 2 skills",
      "gemColor": "#388bfd"
    }
  }
}
```

**Achievement Properties:**
- `id` - Unique identifier for tracking (stored in localStorage)
- `title` - Display name shown in tooltip and celebration
- `icon` - Emoji displayed as the "gem"
- `description` - What this achievement means
- `gemColor` - Hex color for the glowing gem effect (should match category)

**Design Tips:**
- Use evocative titles (e.g., "Spark Lord" instead of "Electrical Master")
- Keep descriptions concise but meaningful
- Match gemColor to the category's accent color
- Consider thematic icons that represent mastery

### 1. treeStructure
Defines parent-child relationships for visual connectors:

```json
{
  "treeStructure": {
    "root": { "children": ["theory-a", "theory-b"] },
    "theory-a": { "children": ["branch-a"] },
    "branch-a": { "children": ["skill-1", "skill-2"] },
    "skill-1": { "children": ["skill-3"] }
  }
}
```

### 2. nodeData
Metadata for rendering each node:

```json
{
  "nodeData": {
    "root": {
      "icon": "🔧",
      "title": "Foundation",
      "subtitle": "Start here",
      "type": "root",
      "category": null
    },
    "theory-a": {
      "icon": "📚",
      "title": "Core Concept",
      "subtitle": "Learn this first",
      "type": "theory",
      "category": null
    },
    "branch-a": {
      "icon": "🔨",
      "title": "SKILL AREA",
      "subtitle": "Description",
      "type": "branch",
      "category": "category1"
    },
    "skill-1": {
      "icon": "📍",
      "title": "Specific Skill",
      "subtitle": "How to do X",
      "type": "skill",
      "category": "category1"
    }
  }
}
```

**Node Types:**
- `root` - Foundation prerequisite (magenta, gradient background)
- `theory` - Conceptual understanding (gray, dashed border)
- `branch` - Major skill categories (category color, gradient background)
- `skill` - Practical skills (category color)

### 3. skillData
Full content for the detail panel:

```json
{
  "skillData": {
    "root": {
      "type": "Foundation",
      "icon": "🔧",
      "title": "Foundation Skill",
      "content": "<p>HTML content for detail panel...</p><h4>Section</h4><ul><li>Point 1</li></ul>",
      "prereqs": []
    },
    "theory-a": {
      "type": "Theory",
      "icon": "📚",
      "title": "How X Works",
      "content": "<h4>The Mental Model</h4><p>...</p>",
      "prereqs": ["Foundation Skill"]
    }
  }
}
```

---

## Content Quality Requirements

### Theory Section Requirements
Every skill tree MUST include comprehensive theory sections covering:

1. **Mental Models** - Simple conceptual framework
2. **Core Principles** - Fundamental laws/rules (4-6 items)
3. **Technical Details** - Science, math, or mechanics (4-6 items)
4. **Common Failure Modes** - What goes wrong and why (4-6 items)
5. **Diagnostic Thinking** - How to troubleshoot
6. **Safety & Standards** - Requirements and considerations
7. **Why This Matters** - Practical applications

### Theory Content Template

```html
<h4>The Mental Model</h4>
<p>Simple 1-2 sentence explanation. Use <strong>bold</strong> for key terms.</p>

<h4>System Overview</h4>
<pre>ASCII diagram showing components
┌─────────┐    ┌─────────┐
│ PART A  │───→│ PART B  │
└─────────┘    └─────────┘</pre>

<h4>Core Principles</h4>
<ul>
  <li><strong>Principle:</strong> Detailed explanation</li>
</ul>

<h4>Technical Details</h4>
<ul>
  <li><strong>Concept:</strong> In-depth explanation</li>
</ul>

<h4>Common Failure Modes</h4>
<ul>
  <li><strong>Failure Type:</strong> Cause, symptoms, prevention</li>
</ul>

<h4>Diagnostic Methodology</h4>
<ul>
  <li><strong>Symptom:</strong> Systematic diagnostic approach</li>
</ul>

<h4>Standards & Requirements</h4>
<ul>
  <li><strong>Standard:</strong> Requirement and rationale</li>
</ul>

<h4>Why This Matters</h4>
<ul>
  <li><strong>Key Takeaway:</strong> Practical impact</li>
</ul>
```

### Content Depth Guidelines

**For Theory Sections:**
- Minimum 400 words per theory topic
- Include ASCII diagrams or visual aids
- Cover conceptual + technical details
- Include troubleshooting approaches

**For Practical Skills:**
- Clear prerequisites
- Step-by-step procedures
- Common mistakes to avoid
- Pro tips from experience

---

## Adding to Index

After creating a new JSON file, add it to `skill-trees/data/index.json`:

```json
[
  {
    "file": "home-improvement.json",
    "name": "Home Improvement",
    "description": "Essential home repair and maintenance skills"
  },
  {
    "file": "new-topic.json",
    "name": "New Topic",
    "description": "Description of this skill tree"
  }
]
```

---

## Completion & Achievement Tracking

The viewer automatically tracks:
- **Completed skills** - localStorage key: `skillTree_[id]_completed`
- **Unlocked achievements** - localStorage key: `skillTree_[id]_achievements`

Users can click nodes and use the "Mark Complete" button in the detail panel. When all skills in a category are completed, the corresponding achievement gem in the Gauntlet lights up with a celebration animation.

---

## Quality Checklist

Before completing a skill tree JSON:
- [ ] Each theory section is comprehensive (400+ words)
- [ ] Mental models are clear and memorable
- [ ] Technical details are accurate
- [ ] Diagnostic approaches are systematic
- [ ] Prerequisites create logical learning paths
- [ ] All node IDs are unique
- [ ] treeStructure matches nodeData/skillData keys
- [ ] Categories defined and colors assigned
- [ ] Achievements defined for each category with evocative titles
- [ ] Added to index.json

---

## Process Summary

1. Research topic to identify 3-5 core theory areas
2. Create JSON structure with metadata
3. Define `treeStructure` (parent-child relationships)
4. Define `nodeData` (icons, titles, types, categories)
5. Write `skillData` with full HTML content
6. Save to `skill-trees/data/[topic-name].json`
7. Add entry to `skill-trees/data/index.json`
8. Test in viewer: `skill-trees/?tree=[topic-name].json`

---

## Example: Minimal Skill Tree

```json
{
  "id": "cooking-basics",
  "title": "Cooking Basics Skill Tree",
  "description": "Fundamental cooking skills and techniques",
  "achievements": {
    "knife": {
      "id": "knife-master",
      "title": "Blade Master",
      "icon": "🔪",
      "description": "Mastered all knife techniques",
      "gemColor": "#3fb950"
    },
    "heat": {
      "id": "heat-master",
      "title": "Flame Tamer",
      "icon": "🔥",
      "description": "Controls heat like a pro",
      "gemColor": "#d29922"
    }
  },
  "categories": [
    { "name": "Knife Skills", "color": "var(--accent-green)", "id": "knife" },
    { "name": "Heat Control", "color": "var(--accent-orange)", "id": "heat" }
  ],
  "treeStructure": {
    "root": { "children": ["theory-heat", "branch-knife"] },
    "theory-heat": { "children": ["branch-heat"] },
    "branch-knife": { "children": ["basic-cuts"] },
    "branch-heat": { "children": ["saute"] }
  },
  "nodeData": {
    "root": { "icon": "👨‍🍳", "title": "Kitchen Safety", "subtitle": "Start here", "type": "root", "category": null },
    "theory-heat": { "icon": "🔥", "title": "How Heat Works", "subtitle": "Conduction, convection, radiation", "type": "theory", "category": null },
    "branch-knife": { "icon": "🔪", "title": "KNIFE SKILLS", "subtitle": "Cuts & Techniques", "type": "branch", "category": "knife" },
    "branch-heat": { "icon": "🍳", "title": "HEAT CONTROL", "subtitle": "Cooking Methods", "type": "branch", "category": "heat" },
    "basic-cuts": { "icon": "🥕", "title": "Basic Cuts", "subtitle": "Dice, julienne, mince", "type": "skill", "category": "knife" },
    "saute": { "icon": "🥘", "title": "Sautéing", "subtitle": "High heat, quick cook", "type": "skill", "category": "heat" }
  },
  "skillData": {
    "root": {
      "type": "Foundation",
      "icon": "👨‍🍳",
      "title": "Kitchen Safety",
      "content": "<p>Before cooking, understand basic safety...</p>",
      "prereqs": []
    },
    "theory-heat": {
      "type": "Theory",
      "icon": "🔥",
      "title": "How Heat Works",
      "content": "<h4>The Mental Model</h4><p>Heat is energy transfer...</p>",
      "prereqs": ["Kitchen Safety"]
    }
  }
}
```
