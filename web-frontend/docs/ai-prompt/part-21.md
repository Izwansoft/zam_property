# FRONTEND (WEB) — PART 21 — ACCESSIBILITY DEEP DIVE (LOCKED)

This part defines comprehensive **accessibility (a11y) standards and implementation patterns**.
All UI must be usable by people with disabilities, compliant with WCAG 2.1 AA.

All rules from WEB PART 0–20 apply fully.

---

## 21.1 ACCESSIBILITY PRINCIPLES

### Core Principles (POUR)
- **Perceivable**: Content can be perceived by all users
- **Operable**: UI can be operated by all users
- **Understandable**: Content and operation are understandable
- **Robust**: Content works with assistive technologies

### Compliance Target
- WCAG 2.1 Level AA (minimum)
- ARIA Authoring Practices Guide (APG) patterns
- Section 508 compliance (for government clients)

---

## 21.2 SEMANTIC HTML (MANDATORY)

Rules:
- Use semantic elements over generic `div`/`span`
- Heading hierarchy must be logical (h1 → h2 → h3)
- Lists use `ul`/`ol`/`li` appropriately
- Tables use proper `thead`/`tbody`/`th` with scope
- Forms use `label` elements correctly

### Element Mapping

| Purpose | Correct Element | Avoid |
|---------|-----------------|-------|
| Navigation | `<nav>` | `<div class="nav">` |
| Main content | `<main>` | `<div class="main">` |
| Article/Card | `<article>` | `<div class="card">` |
| Section | `<section>` | `<div class="section">` |
| Button | `<button>` | `<div onClick>` |
| Link | `<a href>` | `<span onClick>` |
| Header | `<header>` | `<div class="header">` |
| Footer | `<footer>` | `<div class="footer">` |

```tsx
// ❌ Bad
<div className="card" onClick={handleClick}>
  <div className="card-title">Listing Title</div>
</div>

// ✅ Good
<article className="card">
  <h3 className="card-title">Listing Title</h3>
  <button onClick={handleClick}>View Details</button>
</article>
```

---

## 21.3 KEYBOARD NAVIGATION (MANDATORY)

Rules:
- All interactive elements must be keyboard accessible
- Focus order must be logical (DOM order)
- Focus must be visible at all times
- Custom components must implement keyboard patterns

### Focus Management

```tsx
// Focus visible styles (global)
const focusStyles = `
  :focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }
  
  :focus:not(:focus-visible) {
    outline: none;
  }
`;

// Custom focus trap for modals
function useFocusTrap(containerRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();
    
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef]);
}
```

### Keyboard Shortcuts

| Action | Key | Context |
|--------|-----|---------|
| Submit form | Enter | Form focused |
| Cancel/Close | Escape | Modal/Dialog |
| Navigate items | Arrow keys | List/Menu |
| Select item | Enter/Space | List item focused |
| Skip to main | Skip link | Page load |

```tsx
// Skip to main content link
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md"
    >
      Skip to main content
    </a>
  );
}
```

---

## 21.4 ARIA IMPLEMENTATION

### ARIA Roles for Custom Components

```tsx
// Custom dropdown/select
<div role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
  <input
    aria-autocomplete="list"
    aria-controls="listbox-id"
    aria-activedescendant={activeItemId}
  />
  <ul id="listbox-id" role="listbox" aria-label="Options">
    {options.map(option => (
      <li
        key={option.id}
        id={option.id}
        role="option"
        aria-selected={option.id === selectedId}
      >
        {option.label}
      </li>
    ))}
  </ul>
</div>

// Custom tabs
<div role="tablist" aria-label="Listing details">
  {tabs.map((tab, index) => (
    <button
      key={tab.id}
      role="tab"
      id={`tab-${tab.id}`}
      aria-selected={activeTab === tab.id}
      aria-controls={`panel-${tab.id}`}
      tabIndex={activeTab === tab.id ? 0 : -1}
    >
      {tab.label}
    </button>
  ))}
</div>
{tabs.map(tab => (
  <div
    key={tab.id}
    role="tabpanel"
    id={`panel-${tab.id}`}
    aria-labelledby={`tab-${tab.id}`}
    hidden={activeTab !== tab.id}
  >
    {tab.content}
  </div>
))}
```

### ARIA Live Regions

```tsx
// Toast notifications
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {announcement}
</div>

// Error alerts
<div
  role="alert"
  aria-live="assertive"
>
  {errorMessage}
</div>

// Loading states
<div aria-busy={isLoading} aria-live="polite">
  {isLoading ? 'Loading...' : content}
</div>
```

### ARIA Labels and Descriptions

```tsx
// Icon-only buttons
<button aria-label="Delete listing">
  <TrashIcon aria-hidden="true" />
</button>

// Form field with description
<div>
  <label htmlFor="price">Price</label>
  <input
    id="price"
    aria-describedby="price-help price-error"
  />
  <p id="price-help" className="text-muted-foreground">
    Enter the listing price in MYR
  </p>
  {error && (
    <p id="price-error" className="text-destructive" role="alert">
      {error}
    </p>
  )}
</div>

// Complex widgets
<div
  role="region"
  aria-label="Property gallery"
  aria-describedby="gallery-instructions"
>
  <p id="gallery-instructions" className="sr-only">
    Use arrow keys to navigate between images. Press Enter to view full size.
  </p>
  {/* Gallery content */}
</div>
```

---

## 21.5 FORM ACCESSIBILITY

### Label Association

```tsx
// ✅ Explicit association
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ✅ Implicit association
<label>
  Email
  <input type="email" />
</label>

// ❌ No association (forbidden)
<span>Email</span>
<input type="email" />
```

### Error Handling

```tsx
function FormField({ 
  label, 
  name, 
  error, 
  required,
  helpText 
}: FormFieldProps) {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  
  return (
    <div className="form-field">
      <label htmlFor={inputId}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>
      
      <input
        id={inputId}
        name={name}
        aria-invalid={!!error}
        aria-describedby={`${helpText ? helpId : ''} ${error ? errorId : ''}`.trim() || undefined}
        aria-required={required}
      />
      
      {helpText && (
        <p id={helpId} className="text-muted-foreground text-sm">
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Form Validation Announcements

```tsx
function useFormAnnouncements() {
  const [announcement, setAnnouncement] = useState('');
  
  const announceErrors = (errors: Record<string, string>) => {
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0) {
      setAnnouncement(
        `Form has ${errorCount} error${errorCount > 1 ? 's' : ''}. ` +
        `First error: ${Object.values(errors)[0]}`
      );
    }
  };
  
  const announceSuccess = (message: string) => {
    setAnnouncement(message);
  };
  
  return {
    announcement,
    announceErrors,
    announceSuccess,
    AnnouncerComponent: () => (
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    ),
  };
}
```

---

## 21.6 IMAGE & MEDIA ACCESSIBILITY

### Image Alt Text

```tsx
// Informative image
<img 
  src={listing.image} 
  alt="3 bedroom apartment with ocean view, modern kitchen visible"
/>

// Decorative image
<img src={pattern} alt="" aria-hidden="true" />

// Complex image with description
<figure>
  <img 
    src={floorPlan} 
    alt="Floor plan of unit"
    aria-describedby="floorplan-desc"
  />
  <figcaption id="floorplan-desc">
    Two-story layout: Ground floor has living room, kitchen, and guest bath.
    Upper floor has 3 bedrooms and 2 bathrooms.
  </figcaption>
</figure>
```

### Video Accessibility

```tsx
<video controls aria-label="Property walkthrough video">
  <source src={videoUrl} type="video/mp4" />
  <track 
    kind="captions" 
    src={captionsUrl} 
    srcLang="en" 
    label="English captions"
    default
  />
  <track 
    kind="descriptions" 
    src={descriptionsUrl} 
    srcLang="en" 
    label="Audio descriptions"
  />
  Your browser does not support video playback.
</video>
```

---

## 21.7 COLOR & CONTRAST

### Minimum Contrast Ratios

| Element | WCAG AA | WCAG AAA |
|---------|---------|----------|
| Normal text | 4.5:1 | 7:1 |
| Large text (18pt+) | 3:1 | 4.5:1 |
| UI components | 3:1 | 3:1 |
| Focus indicators | 3:1 | 3:1 |

### Color Independence

Rules:
- Never use color alone to convey meaning
- Always pair with text, icons, or patterns

```tsx
// ❌ Bad: Color only
<span className={status === 'active' ? 'text-green-500' : 'text-red-500'}>
  {status}
</span>

// ✅ Good: Color + icon + text
<span className={status === 'active' ? 'text-green-500' : 'text-red-500'}>
  {status === 'active' ? (
    <>
      <CheckCircle className="inline mr-1" aria-hidden="true" />
      Active
    </>
  ) : (
    <>
      <XCircle className="inline mr-1" aria-hidden="true" />
      Inactive
    </>
  )}
</span>
```

### Focus Visibility

```css
/* Ensure focus is always visible */
.focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2;
}

/* High contrast mode support */
@media (forced-colors: active) {
  .focus-ring:focus-visible {
    outline: 2px solid CanvasText;
  }
}
```

---

## 21.8 RESPONSIVE & ZOOM ACCESSIBILITY

Rules:
- Content must be usable at 200% zoom
- Text must be resizable up to 200%
- No horizontal scrolling at 320px width (for 400% zoom)
- Touch targets minimum 44x44px

```tsx
// Touch-friendly button
<button className="min-h-[44px] min-w-[44px] p-3">
  <Icon className="h-5 w-5" />
</button>

// Responsive text
<p className="text-base md:text-lg">
  {/* Text scales appropriately */}
</p>
```

---

## 21.9 DATA TABLE ACCESSIBILITY

```tsx
function DataTable({ data, columns }: DataTableProps) {
  return (
    <div role="region" aria-label="Listings table" tabIndex={0}>
      <table>
        <caption className="sr-only">
          Listings data with {data.length} rows
        </caption>
        <thead>
          <tr>
            {columns.map(col => (
              <th 
                key={col.id} 
                scope="col"
                aria-sort={col.sorted ? col.sortDirection : undefined}
              >
                {col.sortable ? (
                  <button
                    onClick={() => handleSort(col.id)}
                    aria-label={`Sort by ${col.label}`}
                  >
                    {col.label}
                    <SortIcon direction={col.sortDirection} />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id}>
              {columns.map(col => (
                <td key={col.id} headers={col.id}>
                  {row[col.id]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 21.10 MODAL & DIALOG ACCESSIBILITY

```tsx
function AccessibleDialog({ 
  open, 
  onClose, 
  title, 
  description, 
  children 
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  
  // Save and restore focus
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
    } else {
      previousFocus.current?.focus();
    }
  }, [open]);
  
  // Focus trap
  useFocusTrap(dialogRef);
  
  // Escape to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, onClose]);
  
  if (!open) return null;
  
  return (
    <Portal>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        aria-hidden="true"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        className="fixed inset-0 flex items-center justify-center"
      >
        <div className="bg-background p-6 rounded-lg max-w-md w-full">
          <h2 id="dialog-title">{title}</h2>
          <p id="dialog-description">{description}</p>
          {children}
          <button onClick={onClose} aria-label="Close dialog">
            <XIcon aria-hidden="true" />
          </button>
        </div>
      </div>
    </Portal>
  );
}
```

---

## 21.11 LOADING & ASYNC STATES

```tsx
// Skeleton with aria
function SkeletonCard() {
  return (
    <div aria-busy="true" aria-label="Loading listing">
      <div className="skeleton h-48 w-full" />
      <div className="skeleton h-4 w-3/4 mt-4" />
      <div className="skeleton h-4 w-1/2 mt-2" />
    </div>
  );
}

// Loading button
function LoadingButton({ loading, children, ...props }: LoadingButtonProps) {
  return (
    <button 
      {...props} 
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <Spinner className="mr-2" aria-hidden="true" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Page loading announcement
function PageLoader() {
  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        Loading page content, please wait.
      </div>
      <Spinner className="h-8 w-8" />
    </>
  );
}
```

---

## 21.12 TESTING ACCESSIBILITY

### Automated Testing

```typescript
// Jest + Testing Library
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('ListingCard', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<ListingCard listing={mockListing} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// Playwright a11y testing
test('page should be accessible', async ({ page }) => {
  await page.goto('/listings');
  const violations = await new AxeBuilder({ page }).analyze();
  expect(violations.violations).toEqual([]);
});
```

### Manual Testing Checklist

- [ ] Navigate entire page using only keyboard
- [ ] Test with screen reader (NVDA/VoiceOver)
- [ ] Verify at 200% zoom
- [ ] Check color contrast with DevTools
- [ ] Verify focus order is logical
- [ ] Test with reduced motion preference
- [ ] Verify all images have appropriate alt text
- [ ] Test forms with only keyboard
- [ ] Verify error messages are announced

---

## 21.13 ACCESSIBILITY UTILITIES

```typescript
// hooks/useReducedMotion.ts
function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);
  
  return reducedMotion;
}

// hooks/useAnnounce.ts
function useAnnounce() {
  const [announcement, setAnnouncement] = useState('');
  
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement('');
    // Small delay to ensure re-announcement
    setTimeout(() => setAnnouncement(message), 100);
  }, []);
  
  const Announcer = () => (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  );
  
  return { announce, Announcer };
}

// components/VisuallyHidden.tsx
function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}
```

---

## 21.14 FORBIDDEN PRACTICES

You must not:
- Use `div` or `span` for interactive elements
- Remove focus outlines without replacement
- Use color alone to convey information
- Create keyboard traps
- Auto-play audio/video without controls
- Use ARIA incorrectly (first rule: don't use ARIA)
- Forget alt text on informative images
- Use placeholder as label replacement
- Set tabindex > 0
- Hide content with display:none that should be announced

---

## 21.15 EXECUTION DIRECTIVE

All UI must:
- Be fully keyboard navigable
- Work with screen readers
- Meet WCAG 2.1 AA contrast ratios
- Use semantic HTML first, ARIA when needed
- Handle focus management properly
- Announce dynamic content changes
- Be testable for accessibility

Accessibility is not optional.

END OF WEB PART 21.
