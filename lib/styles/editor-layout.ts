export const EDITOR_LAYOUT_CLASSES = {
    // Main container that holds both the left panel and the right content
    // Main container that holds both the left panel and the right content
    // Centers everything and ensures height is within 500-800px range (or fits viewport minus header)
    container: "w-full mx-auto px-4 flex gap-6 items-stretch justify-center h-auto min-h-[calc(100vh-180px)]",

    // Left column wrapper - fixed width 350px with strict min/max constraints
    // Left column wrapper - fixed width 350px with strict min/max constraints
    leftColumn: "flex-shrink-0 flex flex-col w-[350px] min-w-[350px] max-w-[350px] min-h-[650px] max-h-[850px]",

    // The actual panel card inside the left column
    // This needs to be flex/h-full to fill the column height
    leftPanelCard: "bg-[#0f0f12]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col h-fit min-h-full",

    // Right content area - grows to fill remaining space
    rightColumn: "flex-grow flex items-center justify-center relative min-w-[400px] max-w-[850px] max-h-[850px] overflow-hidden"
}
