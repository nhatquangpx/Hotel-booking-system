# Admin Management SCSS Files

This directory contains SCSS files for the admin management components of the Hotel Booking System.

## Overview

These SCSS files provide styling for different sections of the admin dashboard:

1. **AdminDetailPage.scss**: Styling for detail pages (viewing detailed information)
2. **AdminFormPage.scss**: Styling for form pages (creating/editing entities)
3. **AdminListPage.scss**: Styling for list pages (displaying data in tabular format)
4. **UserManagement.scss**: Specific styling for user management section
5. **RoomManagement.scss**: Specific styling for room management section
6. **BookingManagement.scss**: Specific styling for booking management section

## Usage

Import these files in your React components as needed:

```jsx
// For general admin components
import './AdminComponent/AdminComponents.scss';

// For detail pages (viewing an entity)
import './AdminComponent/AdminDetailPage.scss';

// For form pages (creating/editing)
import './AdminComponent/AdminFormPage.scss';

// For list pages (tables/grids)
import './AdminComponent/AdminListPage.scss';

// For specific management sections
import './AdminComponent/UserManagement.scss';
import './AdminComponent/RoomManagement.scss';
import './AdminComponent/BookingManagement.scss';
```

## Styling Guidelines

These files follow a consistent style pattern:

- Container classes use `[entity]-[page-type]-container` naming (e.g., `user-list-container`)
- Color scheme uses a consistent palette with primary blue (#3498db) and appropriate status colors
- All components are responsive and use flexible grid layouts
- Form elements have consistent styling and interactive states
- Tables have consistent header/row styling and responsive designs
- Status badges use consistent colors for different states

## Customization

You can modify these files to match your specific design requirements. The main variables to consider changing are:

- Colors (primary colors, status colors)
- Spacing and padding
- Border radius values
- Shadow effects
- Typography (font sizes, weights) 