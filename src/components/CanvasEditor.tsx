import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Line, Circle, Group } from 'react-konva';
import useImage from 'use-image';
import { 
  Search, 
  Plus, 
  Upload, 
  Hand, 
  Type, 
  Image as ImageIcon, 
  Activity, 
  Undo2, 
  Redo2, 
  Maximize2, 
  Minus, 
  ChevronRight,
  MoreHorizontal,
  Share2,
  Download,
  MousePointer2
} from 'lucide-react';
import { GeneratedContent } from '../types';
import { cn } from '../lib/utils';

// --- Components ---

const ConceptNode = ({ x, y, title, description, status, isSelected, onSelect }: any) => {
  return (
    <Group x={x} y={y} onClick={onSelect} onTap={onSelect} draggable>
      {/* Shadow/Glow */}
      <Rect
        width={320}
        height={240}
        fill="white"
        cornerRadius={24}
        shadowBlur={20}
        shadowColor="rgba(0,0,0,0.05)"
        shadowOffset={{ x: 0, y: 10 }}
      />
      
      {/* Header */}
      <Group x={24} y={24}>
        <Rect width={100} height={24} fill="#f0fdf4" cornerRadius={6} />
        <Text text="CONCEPT PHASE" fontSize={10} fontFamily="Inter" fontWeight="bold" fill="#10b981" x={8} y={7} />
        <Text text="..." fontSize={20} fontFamily="Inter" fill="#cbd5e1" x={260} y={-5} />
      </Group>

      {/* Content */}
      <Text 
        text={title} 
        fontSize={20} 
        fontFamily="Inter" 
        fontWeight="bold" 
        fill="#1a1a1a" 
        x={24} 
        y={64} 
        width={272} 
      />
      <Text 
        text={description} 
        fontSize={14} 
        fontFamily="Inter" 
        fill="#64748b" 
        x={24} 
        y={100} 
        width={272} 
        lineHeight={1.5}
      />

      {/* Footer */}
      <Group x={24} y={190}>
        <Circle radius={4} fill="#10b981" x={4} y={8} />
        <Text text={status} fontSize={12} fontFamily="Inter" fill="#94a3b8" x={16} y={2} />
      </Group>

      {isSelected && (
        <Rect
          width={320}
          height={240}
          stroke="#10b981"
          strokeWidth={2}
          cornerRadius={24}
        />
      )}
    </Group>
  );
};

const VisualNode = ({ x, y, imageUrl, title, aspect, style, isSelected, onSelect }: any) => {
  const [img] = useImage(imageUrl, 'anonymous');
  
  return (
    <Group x={x} y={y} onClick={onSelect} onTap={onSelect} draggable>
      <Rect
        width={320}
        height={340}
        fill="white"
        cornerRadius={24}
        shadowBlur={20}
        shadowColor="rgba(0,0,0,0.05)"
        shadowOffset={{ x: 0, y: 10 }}
      />

      {/* Image Container */}
      <Group x={12} y={12}>
        <Rect width={296} height={220} fill="#f8fafc" cornerRadius={16} clip />
        {img && (
          <KonvaImage 
            image={img} 
            width={296} 
            height={220} 
            cornerRadius={16}
          />
        )}
        
        {/* Image Label */}
        <Rect width={100} height={24} fill="rgba(0,0,0,0.6)" cornerRadius={6} x={12} y={12} />
        <Text text={title} fontSize={10} fontFamily="Inter" fontWeight="bold" fill="white" x={20} y={19} />
        
        {/* Image Overlay Text */}
        <Text 
          text="HIGH-END\nORGANIC" 
          fontSize={18} 
          fontFamily="Inter" 
          fontWeight="bold" 
          fill="white" 
          align="center"
          width={296}
          y={90}
          opacity={0.9}
        />
      </Group>

      {/* Info */}
      <Group x={24} y={250}>
        <Text text={`ASPECT: ${aspect}`} fontSize={11} fontFamily="Inter" fontWeight="bold" fill="#94a3b8" />
        <Text text={`STYLE: ${style}`} fontSize={11} fontFamily="Inter" fontWeight="bold" fill="#94a3b8" x={180} />
      </Group>

      {/* Button */}
      <Group x={24} y={280}>
        <Rect width={272} height={40} stroke="#e2e8f0" strokeWidth={1} cornerRadius={20} />
        <Text text="Edit with AI" fontSize={12} fontFamily="Inter" fontWeight="bold" fill="#10b981" width={272} align="center" y={14} />
      </Group>

      {isSelected && (
        <Rect
          width={320}
          height={340}
          stroke="#10b981"
          strokeWidth={2}
          cornerRadius={24}
        />
      )}
    </Group>
  );
};

export const CanvasEditor = ({ initialContent, onClose }: { initialContent?: GeneratedContent[], onClose?: () => void }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (initialContent && initialContent.length > 0) {
      const newNodes = initialContent.map((content, idx) => ({
        id: `node-${idx}-${Date.now()}`,
        type: content.imageUrl ? 'visual' : 'concept',
        x: 100 + idx * 350,
        y: 100 + (idx % 2) * 100,
        title: content.imageUrl ? `VISUAL ${idx + 1}` : content.text.split('\n')[0].substring(0, 30),
        description: content.text.substring(0, 100) + '...',
        imageUrl: content.imageUrl,
        status: 'Generated by AI',
        aspect: '16:9',
        style: 'Editorial'
      }));
      setNodes(newNodes);
    }
  }, [initialContent]);

  const handleDragStart = (e: React.DragEvent, type: string, data: any) => {
    e.dataTransfer.setData('type', type);
    e.dataTransfer.setData('data', JSON.stringify(data));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!stageRef.current) return;

    stageRef.current.setPointersPositions(e);
    const pos = stageRef.current.getPointerPosition();
    const type = e.dataTransfer.getData('type');
    const data = JSON.parse(e.dataTransfer.getData('data'));

    const newNode = {
      id: `node-${Date.now()}`,
      type: type,
      x: (pos.x - stageRef.current.x()) / zoom,
      y: (pos.y - stageRef.current.y()) / zoom,
      ...data,
      status: 'Added to Canvas',
      aspect: '16:9',
      style: 'Editorial'
    };

    setNodes([...nodes, newNode]);
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.1, Math.min(newScale, 5));
    
    setZoom(clampedScale);
    
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    stage.position(newPos);
  };

  const handleZoomIn = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const newScale = Math.min(oldScale * 1.2, 5);
    
    const center = {
      x: (dimensions.width - 288) / 2,
      y: (dimensions.height - 80) / 2,
    };

    const relatedPoint = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    setZoom(newScale);
    stage.position({
      x: center.x - relatedPoint.x * newScale,
      y: center.y - relatedPoint.y * newScale,
    });
  };

  const handleZoomOut = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const newScale = Math.max(oldScale / 1.2, 0.1);
    
    const center = {
      x: (dimensions.width - 288) / 2,
      y: (dimensions.height - 80) / 2,
    };

    const relatedPoint = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    setZoom(newScale);
    stage.position({
      x: center.x - relatedPoint.x * newScale,
      y: center.y - relatedPoint.y * newScale,
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    const stage = stageRef.current;
    if (stage) stage.position({ x: 0, y: 0 });
  };

  const handleExport = () => {
    if (stageRef.current) {
      const dataUrl = stageRef.current.toDataURL();
      const link = document.createElement('a');
      link.download = 'creative-strategy-canvas.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 flex bg-[#f8f9fa] overflow-hidden font-sans z-[100]" ref={containerRef}>
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col z-20">
        <div className="p-6 space-y-8 flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search library..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Brand Assets */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Brand Assets</h3>
            <div className="grid grid-cols-2 gap-3">
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'concept', { title: 'Logo_V1', description: 'Primary brand mark for visual identity.' })}
                className="aspect-square bg-emerald-50 rounded-2xl p-3 flex flex-col justify-between border border-emerald-100/50 group cursor-pointer hover:bg-emerald-100 transition-colors"
              >
                <div className="w-full h-16 bg-emerald-900/20 rounded-lg overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-emerald-800 to-emerald-950 opacity-80" />
                </div>
                <span className="text-[10px] font-bold text-emerald-800 text-center">Logo_V1</span>
              </div>
              <div 
                draggable
                onDragStart={(e) => handleDragStart(e, 'concept', { title: 'Palettes', description: 'Brand color system and accessibility guidelines.' })}
                className="aspect-square bg-gray-50 rounded-2xl p-3 flex flex-col justify-between border border-gray-100 group cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="grid grid-cols-2 gap-1 h-16">
                  <div className="bg-gray-200 rounded-sm" />
                  <div className="bg-stone-300 rounded-sm" />
                  <div className="bg-emerald-200 rounded-sm" />
                  <div className="bg-white border border-gray-100 rounded-sm" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 text-center">Palettes</span>
              </div>
            </div>
          </div>

          {/* AI Library */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">AI Library</h3>
            <div className="space-y-3">
              <div 
                draggable
                onDragStart={(e) => handleDragStart(e, 'concept', { title: 'LinkedIn Hook', description: 'Professional LinkedIn hook for sustainability startup focusing on circular economy.' })}
                className="p-4 bg-white border border-gray-100 rounded-2xl space-y-3 hover:shadow-md transition-shadow cursor-pointer"
              >
                <p className="text-[11px] text-gray-500 italic leading-relaxed">
                  "Professional LinkedIn hook for sustainability startup..."
                </p>
                <div className="flex justify-between items-center">
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-bold uppercase tracking-widest rounded">Text Draft</span>
                  <MoreHorizontal className="w-3 h-3 text-gray-300" />
                </div>
              </div>
              <div 
                draggable
                onDragStart={(e) => handleDragStart(e, 'visual', { title: 'VISUAL ASSET', imageUrl: 'https://picsum.photos/seed/visual1/300/200' })}
                className="p-4 bg-white border border-gray-100 rounded-2xl space-y-3 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                  <img src="https://picsum.photos/seed/visual1/300/200" alt="Visual" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-bold uppercase tracking-widest rounded">Visual</span>
                  <MoreHorizontal className="w-3 h-3 text-gray-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <button className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Assets
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 flex justify-between items-center z-10">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onClose}>
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">AI Creative Studio</h1>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Creative Strategy Canvas</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                  <img src={`https://picsum.photos/seed/user${i}/32/32`} alt="User" referrerPolicy="no-referrer" />
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-50 flex items-center justify-center text-[10px] font-bold text-emerald-600">
                +3
              </div>
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              Export Strategy
            </button>
          </div>
        </header>

        {/* Canvas Area */}
        <div 
          className="flex-1 relative bg-[#fcfcfc]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {/* Dotted Grid Background */}
          <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{ 
              backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
              backgroundSize: '24px 24px' 
            }} 
          />

          <Stage
            ref={stageRef}
            width={dimensions.width - 288}
            height={dimensions.height - 80}
            scaleX={zoom}
            scaleY={zoom}
            draggable
            onWheel={handleWheel}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) setSelectedId(null);
            }}
          >
            <Layer>
              {nodes.map((node, i) => (
                node.type === 'concept' ? (
                  <ConceptNode 
                    key={node.id}
                    {...node}
                    isSelected={selectedId === node.id}
                    onSelect={() => setSelectedId(node.id)}
                    onDragEnd={(e: any) => {
                      const newNodes = [...nodes];
                      newNodes[i] = { ...newNodes[i], x: e.target.x(), y: e.target.y() };
                      setNodes(newNodes);
                    }}
                  />
                ) : (
                  <VisualNode 
                    key={node.id}
                    {...node}
                    isSelected={selectedId === node.id}
                    onSelect={() => setSelectedId(node.id)}
                    onDragEnd={(e: any) => {
                      const newNodes = [...nodes];
                      newNodes[i] = { ...newNodes[i], x: e.target.x(), y: e.target.y() };
                      setNodes(newNodes);
                    }}
                  />
                )
              ))}
            </Layer>
          </Stage>

          {/* Floating Toolbar */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white rounded-3xl shadow-2xl border border-gray-100 p-2 flex items-center gap-1 z-30">
            <button className="p-3 hover:bg-gray-50 rounded-2xl text-gray-400 transition-colors"><Hand className="w-5 h-5" /></button>
            <button className="p-3 hover:bg-gray-50 rounded-2xl text-gray-400 transition-colors"><Type className="w-5 h-5" /></button>
            <button className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20"><ImageIcon className="w-5 h-5" /></button>
            <button className="p-3 hover:bg-gray-50 rounded-2xl text-gray-400 transition-colors"><Activity className="w-5 h-5" /></button>
            <div className="w-px h-8 bg-gray-100 mx-2" />
            <button className="p-3 hover:bg-gray-50 rounded-2xl text-gray-400 transition-colors"><Undo2 className="w-5 h-5" /></button>
            <button className="p-3 hover:bg-gray-50 rounded-2xl text-gray-400 transition-colors"><Redo2 className="w-5 h-5" /></button>
            <div className="w-px h-8 bg-gray-100 mx-2" />
            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-gray-100 ml-1">
              <img src="https://picsum.photos/seed/user-main/40/40" alt="User" referrerPolicy="no-referrer" />
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-10 right-10 flex flex-col gap-3 z-30">
            <button 
              onClick={handleZoomIn}
              className="w-12 h-12 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-emerald-500 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button 
              onClick={handleZoomOut}
              className="w-12 h-12 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-emerald-500 transition-all"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button 
              onClick={handleResetZoom}
              className="w-12 h-12 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-emerald-500 transition-all"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
