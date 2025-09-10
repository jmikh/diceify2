const fs = require('fs');
const path = require('path');

// List of all components to update
const components = [
  { path: 'components/Editor/ImageUploader.tsx', name: 'ImageUploader' },
  { path: 'components/Editor/Cropper.tsx', name: 'Cropper' },
  { path: 'components/Editor/DiceCanvas.tsx', name: 'DiceCanvas' },
  { path: 'components/Editor/ControlPanel.tsx', name: 'ControlPanel' },
  { path: 'components/Editor/DiceStats.tsx', name: 'DiceStats' },
  { path: 'components/Editor/BuildViewer.tsx', name: 'BuildViewer' },
  { path: 'components/Editor/BuildProgress.tsx', name: 'BuildProgress' },
  { path: 'components/Editor/ConfirmDialog.tsx', name: 'ConfirmDialog' },
  { path: 'components/Editor/ProjectSelector.tsx', name: 'ProjectSelector' },
  { path: 'components/Editor/DiceStepper.tsx', name: 'DiceStepper' },
  { path: 'components/AnimatedBackground.tsx', name: 'AnimatedBackground' },
  { path: 'components/AuthModal.tsx', name: 'AuthModal' },
  { path: 'app/editor/page.tsx', name: 'EditorPage' },
];

components.forEach(({ path: filePath, name }) => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Check if already has useRenderLog
  if (content.includes('useRenderLog')) {
    console.log(`✓ Already has logging: ${name}`);
    return;
  }
  
  // Add import if not present
  if (!content.includes("import { useRenderLog }")) {
    // Find the last import statement
    const importMatch = content.match(/(import[\s\S]*?from\s+['"][^'"]+['"][\s\S]*?\n)/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;
      content = content.slice(0, insertPosition) + 
                "import { useRenderLog } from '@/lib/hooks/useRenderLog'\n" +
                content.slice(insertPosition);
    }
  }
  
  // Add useRenderLog call
  // Find the component function
  const functionPatterns = [
    `export default function ${name}`,
    `function ${name}`,
    `const ${name} = `,
    `export function ${name}`,
  ];
  
  let added = false;
  for (const pattern of functionPatterns) {
    if (content.includes(pattern)) {
      // Find the opening brace after the function declaration
      const functionIndex = content.indexOf(pattern);
      const openBraceIndex = content.indexOf('{', functionIndex);
      
      if (openBraceIndex !== -1) {
        // Insert useRenderLog after the opening brace
        const insertPosition = openBraceIndex + 1;
        content = content.slice(0, insertPosition) + 
                  `\n  useRenderLog('${name}')` +
                  content.slice(insertPosition);
        added = true;
        break;
      }
    }
  }
  
  if (added) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Added logging to: ${name}`);
  } else {
    console.log(`⚠️  Could not add logging to: ${name}`);
  }
});

console.log('\n✨ Done!');