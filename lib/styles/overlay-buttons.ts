/**
 * Shared styles for overlay buttons that appear on top of images/canvases
 * Used by BuildViewer zoom controls, DiceCanvas control buttons, and Cropper rotate button
 */

export const overlayButtonStyles = {
  // Standard button class for all overlay buttons (10x10 size)
  button: "w-10 h-10 flex items-center justify-center backdrop-blur-md border rounded-lg transition-all hover:scale-110 shadow-xl",
  
  // Icon size classes
  iconSmall: "w-4 h-4",
  iconMedium: "w-5 h-5",
  
  // Container for button groups
  container: "absolute top-3 right-3 flex gap-2 z-10",
  
  // Bottom container variant
  bottomContainer: "absolute bottom-4 right-4 flex gap-2 z-10"
}

/**
 * Get button style object for overlay buttons
 * @param type - Type of button (used for specific active states)
 * @param isActive - Whether the button is in active state
 * @param theme - Theme object containing color definitions
 * @param customColor - Optional custom color from theme.colors.accent (defaults to purple)
 */
export const getOverlayButtonStyle = (
  type: 'eye' | 'download' | 'zoom' | 'rotate' | 'default' | string,
  isActive: boolean = false,
  theme: any,
  customColor?: string
) => {
  // Always use purple unless a custom color is explicitly provided
  const baseColor = customColor ? theme.colors.accent[customColor] : theme.colors.accent.purple
  
  // All buttons use the same styling pattern now
  return {
    backgroundColor: isActive ? `${baseColor}75` : `${baseColor}50`,
    borderColor: isActive ? baseColor : `${baseColor}80`,
  }
}