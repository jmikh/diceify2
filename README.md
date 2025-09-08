# Diceify - Photo to Dice Art Converter

A high-performance web application that transforms photos into artistic representations made of dice faces. Think of it as converting raster images (pixels) into a mosaic of dice, where brightness determines which dice face to use.

## 🎯 Core Concept

Similar to how ASCII art converts images to text characters, Diceify converts images to dice faces:
- **Dark areas** → Black dice with fewer dots (1-3)
- **Light areas** → White dice with more dots (4-6)
- **Mid-tones** → Mixed based on color mode settings

## 🏗️ Project Structure

```
diceify2/
├── app/                      # Next.js 14 App Router pages
│   ├── layout.tsx           # Root layout with global styles
│   ├── page.tsx            # Landing page (redirects to editor)
│   └── editor/
│       └── page.tsx        # Main application - orchestrates workflow
│
├── components/
│   └── Editor/             # All UI components for the editor
│       ├── ImageUploader.tsx    # Drag-and-drop file upload
│       ├── Cropper.tsx          # Image cropping interface
│       ├── DiceCanvas.tsx       # Canvas-based dice renderer
│       ├── ControlPanel.tsx     # Parameter controls (sliders, inputs)
│       ├── DiceStats.tsx        # Statistics display widget
│       ├── BuildViewer.tsx      # SVG-based build step viewer
│       └── BuildProgress.tsx    # Navigation controls for build
│
├── lib/
│   ├── dice/              # Core dice logic
│   │   ├── generator.ts   # Image → Dice conversion algorithm
│   │   ├── renderer.ts    # Canvas rendering engine
│   │   ├── svg-renderer.ts # SVG rendering for build step
│   │   ├── types.ts       # TypeScript interfaces
│   │   └── constants.ts   # Rendering constants
│   │
│   ├── theme.ts           # Glassmorphism theme configuration
│   └── utils/             # Helper functions
│
├── public/                # Static assets
│   └── images/           # Dice face images (if using images)
│
└── CLAUDE.md             # Detailed product requirements
```

## 🔄 Application Workflow

The application follows a linear workflow with distinct steps:

### 1. **Upload Step** (`ImageUploader.tsx`)
- User uploads an image via drag-and-drop or file picker
- Client-side validation and resizing
- Maximum input: 4096x4096 pixels

### 2. **Crop Step** (`Cropper.tsx`)
- Interactive cropping with zoom/pan
- Aspect ratio presets
- Uses `react-cropper` library

### 3. **Generate Step** (`DiceCanvas.tsx` + `generator.ts`)
- **Image Processing Pipeline:**
  ```
  Image → Grayscale → Grid Division → Brightness Mapping → Dice Assignment
  ```
- Real-time parameter adjustments
- Canvas-based rendering for performance

### 4. **Build Step** (`BuildViewer.tsx`)
- Navigate through dice one-by-one
- SVG rendering with viewBox zooming
- Shows consecutive dice counts
- Progress tracking

## 🎨 Rendering Systems

### Canvas Renderer (Generate Step)
- High-performance batch rendering
- Viewport culling for large grids
- Pre-cached dice images as ImageBitmaps
- Handles 10,000+ dice smoothly

### SVG Renderer (Build Step)
- Vector-based for smooth zooming
- ViewBox manipulation for pan/zoom
- CSS transitions for smooth animations
- Memory-efficient for large grids

## 🔧 Key Algorithms

### Brightness to Dice Mapping

```typescript
// Grayscale conversion
grayscale = 0.299 * R + 0.587 * G + 0.114 * B

// Black & White Mode (12 levels)
0-21:    Black die, 1 dot
22-42:   Black die, 2 dots
...
234-255: White die, 1 dot

// Contrast adjustment (additive only)
adjusted = 128 + ((value - 128) * (1 + contrast/100))
```

### Grid Generation Process
1. Divide image into NxN grid cells
2. Calculate average brightness per cell
3. Map brightness to dice face/color
4. Apply optional 90° rotation
5. Return structured grid data

## 🚀 Performance Optimizations

- **Viewport Culling**: Only render visible dice
- **Progressive Rendering**: Show low-res preview immediately
- **Batch Operations**: Group similar dice for single draw calls
- **Pre-caching**: Store rendered dice as ImageBitmaps
- **Debouncing**: Prevent excessive re-renders on parameter changes

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Theme**: Custom glassmorphism design
- **Image Processing**: HTML5 Canvas API
- **Vector Graphics**: SVG with dynamic viewBox
- **Icons**: Lucide React

## 📦 Installation & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## 🎯 Design Patterns

### Component Architecture
- **Page Component** (`editor/page.tsx`): State management, orchestration
- **Presentational Components**: Receive props, minimal state
- **Render Props**: Canvas and SVG renderers as services
- **Controlled Components**: All inputs controlled by parent state

### State Management
- React useState for UI state
- Prop drilling for simplicity (no Redux needed)
- Callbacks for child-to-parent communication

## 🔍 Key Technical Decisions

1. **Canvas vs SVG**: Canvas for performance (generate), SVG for quality (build)
2. **Client-side First**: All processing happens in browser
3. **No Backend Required**: Works offline once loaded
4. **Progressive Enhancement**: Low-res preview, then full quality
5. **Glassmorphism UI**: Modern, semi-transparent design

## 📊 Data Flow

```
User Input → Page Component → Child Components → Renderers
    ↓             ↓                   ↑              ↑
  Image     State Updates       Callbacks      Grid Data
```

## 🎮 User Controls

- **Grid Size**: 10-100 dice per row
- **Color Mode**: B&W, Black only, White only
- **Contrast**: 0-100 (additive)
- **Rotation**: 90° individual dice rotation
- **Die Size**: Physical size in mm
- **Cost**: Price calculation

## 🏗️ Future Enhancements

- Web Workers for parallel processing
- WebGL renderer for 20,000+ dice
- Save/load projects
- User galleries
- Animation between states
- Custom dice designs
- Color dice support

## 📝 Notes for Backend Engineers

Coming from backend development? Here's what's different:

1. **No Server State**: Everything lives in the browser
2. **Event-Driven**: User interactions trigger re-renders
3. **Declarative UI**: Describe what UI should look like, React handles updates
4. **Component Lifecycle**: Components mount/unmount as user navigates
5. **Async Everything**: File reads, image processing all async
6. **No Database**: Data is ephemeral unless explicitly saved

The mental model is closer to a desktop application than a traditional web app - think of it as a self-contained image processing program that happens to run in a browser.