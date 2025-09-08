# GENERAL INSTRUCTIONS
- If you find yourself writing complicated code that you think could be way easier with library, let me know and we can use websearch or other to find an appropriate one.
- Always keep code modular and don't repeat yourself.
- Do not implement things I did not ask for. If you think they'd be useful ask me instead.

# Dice Art Generator - Product Requirements Document

## Product Overview
A high-performance web application that transforms photos into artistic representations made of dice faces. Built with scalability in mind to handle thousands of dice while maintaining smooth performance. Client-side first approach with future-ready architecture for backend features.

## Technology Stack

### Core Framework
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React 18** with Suspense for loading states

### Image Processing
- **react-cropper** for image cropping and zoom
- **Canvas API** for dice rendering
- **OffscreenCanvas** for background processing
- **Web Workers** for parallel computation (Phase 2)

### Performance Libraries
- **ImageBitmap API** for cached dice faces
- **requestAnimationFrame** for smooth animations
- **requestIdleCallback** for progressive rendering

### Future Backend Stack
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js
- **Storage**: S3-compatible for projects
- **Deployment**: Vercel/Railway

## Core Workflow

### Step 1: Image Upload
- Drag-and-drop or click to upload
- Client-side image validation and resizing
- Show image metadata (dimensions, size)
- Maximum input size: 4096x4096 (resize if larger)
- FileReader API for client-side processing

### Step 2: Crop & Zoom
- Interactive viewport with smooth pan/zoom
- Touch gesture support
- Crop aspect ratio presets (square, 16:9, custom)
- Grid overlay option
- Reset and undo controls
- Uses react-cropper library

### Step 3: Dice Art Generation
- Real-time preview with progressive enhancement
- Live parameter adjustments
- Performance mode toggle (quality vs speed)
- Export options (client-side download)

## Dice Mapping Algorithm

### Grayscale Conversion
```typescript
const toGrayscale = (r: number, g: number, b: number) => 
  0.299 * r + 0.587 * g + 0.114 * b
```

### Brightness to Dice Mapping
- **Black & White Mode (12 dice faces)**
  - Values 0-21: Black die showing 1 (darkest)
  - Values 22-42: Black die showing 2
  - Values 43-63: Black die showing 3
  - Values 64-85: Black die showing 4
  - Values 86-106: Black die showing 5
  - Values 107-127: Black die showing 6 (lightest of dark tones)
  - Values 128-149: White die showing 6 (darkest of light tones)
  - Values 150-170: White die showing 5
  - Values 171-191: White die showing 4
  - Values 192-212: White die showing 3
  - Values 213-233: White die showing 2
  - Values 234-255: White die showing 1 (lightest)

- **Black Only Mode (6 dice faces)**
  - Maps 0-255 to black dice 1-6 (1=darkest, 6=lightest)

- **White Only Mode (6 dice faces)**
  - Maps 0-255 to white dice 6-1 (6=darkest, 1=lightest)

### Contrast Enhancement
- Range: 0-100 (additive only, no reduction)
- Formula: `adjusted = 128 + ((value - 128) * (1 + contrast/100))`
- Clamp to 0-255 range

### Optimization: Blur Method
Instead of calculating average for each grid cell:
1. Apply blur filter with radius = image_size / grid_size
2. Sample the blurred pixel at center of each grid cell
3. This gives the average color efficiently

## Performance Architecture

### Critical Optimizations for 5000+ Dice

1. **Pre-rendered Dice Cache**
   - Render all 12 dice faces once at startup
   - Store as ImageBitmap for fast drawing
   - Multiple resolutions for different zoom levels

2. **Viewport Culling**
   - Calculate visible area bounds
   - Only render dice within viewport + buffer
   - Skip off-screen dice entirely

3. **Progressive Rendering**
   - Immediate low-res preview (thumbnai)
   - Chunked rendering with requestAnimationFrame
   - Show progress during generation

4. **Batch Drawing Operations**
   - Group dice by type (same face)
   - Single draw call per dice type when possible
   - Minimize context state changes

### Performance Targets
- **Initial Preview**: <100ms
- **Full Render**: <2s for 100x100 grid (10,000 dice)
- **Pan/Zoom**: 60fps smooth interaction
- **Parameter Changes**: <200ms update

## User Controls

### Grid Size
- Range: 10-100 dice per row (100-10,000 total dice)
- Default: 30x30 (900 dice)
- Real-time preview update
- Warning indicator for >5000 dice

### Color Mode
- Black & White (default)
- Black Only
- White Only

### Contrast
- Range: 0-100
- Default: 0
- Only increases contrast (no reduction)
- Real-time preview

### Statistics Display
- Black dice count
- White dice count
- Total dice count
- Grid dimensions

## Project Structure

```
/app
  /layout.tsx               # Root layout
  /page.tsx                 # Landing page
  /editor
    /page.tsx              # Main editor (client component)
    
/components
  /Editor
    /ImageUploader.tsx     # Drag-drop upload
    /Cropper.tsx          # react-cropper wrapper
    /DiceCanvas.tsx       # Main dice renderer
    /ControlPanel.tsx     # Sliders and controls
    /StatsDisplay.tsx     # Dice count display
    
/lib
  /dice
    /renderer.ts          # Core rendering logic
    /generator.ts         # Dice mapping algorithm
    /cache.ts            # Dice face caching
    /types.ts            # TypeScript interfaces
  /utils
    /image.ts            # Image processing helpers
    /canvas.ts           # Canvas utilities
    
/public
  /images
    /dice                # Dice face assets (if using images)
    
/types
  /index.ts             # Global type definitions
```

## Client-Side Testing Approach

### Development Workflow
1. Run `npm run dev` to start development server
2. Access at `http://localhost:3000/editor`
3. Use browser DevTools for performance monitoring
4. Test with various image sizes and grid settings

### Test Cases
- Small image (500x500) with 30x30 grid
- Large image (4000x4000) with 50x50 grid
- Maximum grid (100x100 = 10,000 dice)
- All color modes
- Contrast adjustments
- Export functionality

### Performance Monitoring
```typescript
// Built into development build
const performanceMetrics = {
  renderTime: 0,
  diceCount: 0,
  fps: 0,
  memoryUsage: 0
}
```

## Export Features
- **PNG Export**: Canvas.toBlob() for client-side download
- **Quality Settings**: User-selectable resolution
- **Include Grid**: Optional grid lines
- **Progress Indicator**: For large exports

## Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers with touch support

## Future Enhancements (Phase 2)
- WebGL renderer for 20,000+ dice
- Web Workers for parallel processing
- Save/load projects (with backend)
- User galleries and sharing
- Physical dice calculator
- Animation between states
- Custom dice designs
- Color dice support

## Development Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run linting
```

## Performance Best Practices
1. Always use ImageBitmap for repeated draws
2. Implement viewport culling for large grids
3. Debounce slider inputs (100ms minimum)
4. Use OffscreenCanvas for preprocessing
5. Progressive rendering for better UX
6. Cache calculations when possible
7. Minimize DOM updates during rendering

## Current Implementation Status
- [x] Project setup with Next.js, TypeScript, Tailwind
- [ ] Basic layout and routing
- [ ] Image upload component
- [ ] Cropper integration
- [ ] Dice rendering engine
- [ ] Control panel
- [ ] Export functionality
- [ ] Performance optimizations