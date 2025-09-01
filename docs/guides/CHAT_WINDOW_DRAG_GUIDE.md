# Chat Window Drag Functionality Guide

## Overview
The C Code Assistant chat window now supports full drag and drop functionality, allowing users to position the chat window anywhere on the screen for optimal workflow integration.

## Features

### 🎯 Drag to Move
- **Click and drag** the chat header to move the window anywhere on screen
- **Visual feedback** during drag with enhanced shadow and scale effect
- **Smooth positioning** with viewport boundary constraints

### 📱 Mobile Support
- **Touch-friendly** drag implementation for mobile devices
- **Optimized constraints** for smaller screens
- **Responsive behavior** that adapts to screen size

### 💾 Position Persistence
- **Automatic saving** of window position in localStorage
- **Position restoration** when reopening the chat
- **Remembers position** across browser sessions

### 🔄 Reset Function
- **Double-click** the chat header to reset to default position (bottom-right)
- **Viewport adjustment** automatically repositions window if it goes off-screen during window resize

## Usage Instructions

### Desktop
1. **Move Window**: Click and drag the chat header to any position
2. **Reset Position**: Double-click the header area (not the buttons)
3. **Visual Cues**: 
   - Grab cursor when hovering over header
   - Grabbing cursor during drag
   - Subtle drag indicator line at top of header

### Mobile/Touch
1. **Move Window**: Touch and drag the header area
2. **Constraints**: Movement is more restricted on small screens for usability
3. **Performance**: Optimized animations for touch devices

## Technical Implementation

### Key Components
- `setupDrag()` - Initializes drag event listeners
- `startDrag()` - Begins drag operation with offset calculation
- `handleDrag()` - Updates position during drag with boundary constraints
- `stopDrag()` - Completes drag and saves position
- `setChatPosition()` - Updates CSS positioning
- `resetPosition()` - Restores default position
- `ensureVisiblePosition()` - Keeps window visible during viewport changes

### CSS Classes
- `.chat-container.dragging` - Applied during drag for visual feedback
- Enhanced header hover states for better UX

### Event Handling
- Mouse events for desktop interaction
- Touch events for mobile devices
- Window resize listener for position adjustment
- Double-click handler for position reset

## Browser Compatibility
- ✅ Modern browsers with ES6+ support
- ✅ Chrome, Firefox, Safari, Edge
- ✅ Mobile browsers with touch support
- ✅ Responsive design compatibility

## Accessibility
- Maintains keyboard navigation for chat controls
- Preserves screen reader compatibility
- Visual drag indicators for users with motor difficulties

## Performance Considerations
- Uses `requestAnimationFrame` for smooth animations
- Minimal DOM manipulation during drag
- Efficient position calculations
- Touch event passive handling where appropriate

## Troubleshooting

### Common Issues
1. **Window disappears**: Use double-click reset or refresh page
2. **Drag not working**: Ensure clicking on header, not buttons
3. **Mobile issues**: Try touch and hold then drag

### Reset Options
- Double-click header to reset position
- Clear localStorage to reset all chat preferences
- Refresh page restores from saved position

## Future Enhancements
- Snap-to-edges functionality
- Multiple preset positions
- Keyboard shortcuts for positioning
- Window docking modes
