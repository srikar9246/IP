import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Rocket, 
  Mail, 
  PenTool, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  BarChart3,
  Image as ImageIcon,
  CheckCircle2,
  ChevronLeft,
  Download,
  Copy,
  Layout,
  Bell,
  Megaphone,
  Plus,
  Search
} from 'lucide-react';
import Markdown from 'react-markdown';
import { TEMPLATES, TemplateType, GeneratedContent } from './types';
import { generateMarketingContent, generateManuscript, generateImage } from './services/gemini';
import { cn } from './lib/utils';
import { CanvasEditor } from './components/CanvasEditor';

const TemplateIcon = ({ id, className }: { id: string; className?: string }) => {
  if (id === 'LinkedIn Authority Post') return <FileText className={className} />;
  if (id === 'Product Launch Ad') return <Rocket className={className} />;
  if (id === 'Email Sequence') return <Mail className={className} />;
  if (id === 'Brand Style Guide') return <PenTool className={className} />;
  return <FileText className={className} />;
};

export default function App() {
  const [step, setStep] = useState<'select' | 'input' | 'result' | 'canvas' | 'history' | 'editor'>('select');
  const [selectedTemplates, setSelectedTemplates] = useState<typeof TEMPLATES[0][]>([]);
  const [topic, setTopic] = useState('');
  const [manuscript, setManuscript] = useState('');
  const [generatedImages, setGeneratedImages] = useState<{url: string, prompt: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [results, setResults] = useState<(GeneratedContent & { template: typeof TEMPLATES[0] })[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const toggleTemplate = (template: typeof TEMPLATES[0]) => {
    setSelectedTemplates(prev => 
      prev.find(t => t.title === template.title) 
        ? prev.filter(t => t.title !== template.title)
        : [...prev, template]
    );
  };

  const handleGenerate = async () => {
    if (!topic || selectedTemplates.length === 0) return;
    setIsGenerating(true);
    try {
      const generationPromises = selectedTemplates.map(async (template) => {
        const content = await generateMarketingContent(topic, template.prompt);
        return { ...content, template };
      });
      
      const newResults = await Promise.all(generationPromises);
      setResults(newResults);
      
      // Save to DB
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Date.now().toString(),
          topic,
          results: newResults
        })
      });
      
      fetchHistory();
      setStep('result');
    } catch (error) {
      console.error(error);
      alert("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setStep('select');
    setSelectedTemplates([]);
    setTopic('');
    setResults([]);
    setManuscript('');
    setGeneratedImages([]);
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateImage(imagePrompt);
      if (imageUrl) {
        setGeneratedImages(prev => [{ url: imageUrl, prompt: imagePrompt }, ...prev]);
        setImagePrompt('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleInitializeProject = async () => {
    if (!topic) return;
    setIsInitializing(true);
    setStep('editor');
    try {
      const data = await generateManuscript(topic);
      setManuscript(data.text);
      
      // Generate initial image
      const imageUrl = await generateImage(data.imagePrompt);
      
      if (imageUrl) {
        setGeneratedImages([
          { url: imageUrl, prompt: data.imagePrompt },
          { url: `https://picsum.photos/seed/${topic}-2/400/400`, prompt: 'Alternative visual concept' },
          { url: `https://picsum.photos/seed/${topic}-3/400/400`, prompt: 'Secondary visual concept' }
        ]);
      } else {
        setGeneratedImages([
          { url: `https://picsum.photos/seed/${topic}-1/800/600`, prompt: data.imagePrompt },
          { url: `https://picsum.photos/seed/${topic}-2/400/400`, prompt: 'Alternative visual concept' },
          { url: `https://picsum.photos/seed/${topic}-3/400/400`, prompt: 'Secondary visual concept' }
        ]);
      }
    } catch (error) {
      console.error(error);
      setManuscript("Failed to initialize project content. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink selection:bg-brand-accent selection:text-white pb-20">
      {/* Header */}
      <nav className="px-10 py-6 flex justify-between items-center bg-transparent">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="w-8 h-8 bg-brand-ink rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">AI Creative Studio</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-brand-ink/60">
            <button onClick={() => setStep('select')} className={cn("hover:text-brand-ink transition-colors relative", step === 'select' && "text-brand-ink after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-brand-ink")}>Home Hub</button>
            {step === 'editor' ? (
              <button onClick={() => setStep('editor')} className={cn("hover:text-brand-ink transition-colors relative", step === 'editor' && "text-brand-ink after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-brand-ink")}>AI Content Editor</button>
            ) : (
              <button onClick={() => setStep('canvas')} className={cn("hover:text-brand-ink transition-colors relative", step === 'canvas' && "text-brand-ink after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-brand-ink")}>Creative Strategy Canvas</button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {step === 'editor' && (
            <div className="hidden lg:flex items-center gap-4 mr-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Drafting: <span className="text-brand-ink italic font-black uppercase">{topic || 'New Campaign'}</span>
              </div>
              <button className="bg-brand-ink text-white px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-black transition-all">
                Publish <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
          <button className="p-2 bg-white rounded-full shadow-sm border border-black/5 hover:bg-gray-50 transition-colors">
            <Bell className="w-5 h-5 text-brand-ink/60" />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-black/10">
            <img src="https://picsum.photos/seed/user/100/100" alt="Avatar" referrerPolicy="no-referrer" />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-10 py-12">
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16"
            >
              {/* Hero Section */}
              <div className="space-y-8">
                <div className="space-y-2">
                  <h1 className="text-7xl font-display italic text-gray-400 font-light leading-tight">Welcome back.</h1>
                  <h1 className="text-7xl font-display font-bold leading-tight">What shall we create?</h1>
                </div>

                <div className="max-w-4xl bg-white rounded-[2.5rem] p-4 shadow-sm border border-black/5 flex items-center gap-4">
                  <div className="p-4 text-emerald-500">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <input 
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter your topic or brand campaign name"
                    className="flex-1 text-xl font-light focus:outline-none placeholder:text-gray-300"
                  />
                  <button 
                    onClick={handleInitializeProject}
                    className="bg-brand-ink text-white px-8 py-4 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-black transition-all"
                  >
                    Initialize Project <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-400 text-sm font-light italic pl-4">Describe the core concept to initialize the studio workspace.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Template Library */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="flex justify-between items-end border-b border-black/5 pb-6">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-display font-bold">Template Library</h2>
                      <p className="text-gray-400 text-sm font-light">Curated frameworks for your creative direction.</p>
                    </div>
                    <button className="text-emerald-500 text-sm font-medium hover:underline">Browse Categories</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {TEMPLATES.map((template, idx) => {
                      return (
                        <motion.div
                          key={template.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-white rounded-[2rem] p-8 shadow-sm border border-black/5 space-y-6 flex flex-col justify-between"
                        >
                          <div className="space-y-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                              <TemplateIcon id={template.title} className="w-6 h-6 text-brand-ink" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-2xl font-display font-bold">{template.title}</h3>
                              <p className="text-gray-400 text-sm font-light leading-relaxed">{template.description}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                              {idx === 0 ? 'EDITORIAL' : idx === 1 ? 'MARKETING' : idx === 2 ? 'RETENTION' : 'STRATEGY'}
                            </span>
                            <button 
                              onClick={() => {
                                setSelectedTemplates([template]);
                                setStep('input');
                              }}
                              className="px-6 py-2.5 bg-brand-ink text-white rounded-full text-xs font-bold hover:bg-black transition-all"
                            >
                              Use Template
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                  {/* Studio Capacity */}
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-black/5 space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-display font-bold">Studio Capacity</h3>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-[8px] font-bold uppercase tracking-widest rounded-md">Premium</span>
                    </div>
                    <div className="flex justify-center py-4">
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 * (1 - 0.75)} className="text-gray-200" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-display font-bold">75%</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Credits</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-400">AI Computation</span>
                        <span>1,240 / 1,500</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[82%]" />
                      </div>
                    </div>
                  </div>

                  {/* Featured Styles */}
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-black/5 space-y-8">
                    <h3 className="text-lg font-display font-bold">Featured Styles</h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Kinfolk Minimalism', desc: 'CLEAN, AIRY, ORGANIC', img: 'https://picsum.photos/seed/kinfolk/100/100' },
                        { name: 'Neo-Brutalism', desc: 'BOLD, STRUCTURED, HIGH-CONTRAST', img: 'https://picsum.photos/seed/neo/100/100' },
                        { name: 'Ethereal Grain', desc: 'TEXTURED, NOSTALGIC, WARM', img: 'https://picsum.photos/seed/ethereal/100/100' }
                      ].map((style) => (
                        <div key={style.name} className="flex items-center gap-4 group cursor-pointer">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-black/5">
                            <img src={style.img} alt={style.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold">{style.name}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{style.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full py-3 border border-black/5 rounded-full text-xs font-bold text-gray-400 hover:bg-gray-50 transition-colors">
                      Explore Style Library
                    </button>
                  </div>

                  {/* Quote */}
                  <div className="relative p-10 border border-dashed border-gray-300 rounded-[2.5rem] flex flex-col items-center text-center space-y-4">
                    <p className="text-lg font-display italic text-gray-500 leading-relaxed">
                      "Style is a way to say who you are without having to speak."
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">— Rachel Zoe</span>
                  </div>
                </div>
              </div>

              {/* Floating Action Button */}
              <button className="fixed bottom-10 right-10 bg-brand-ink text-white px-8 py-4 rounded-full font-display font-bold text-lg shadow-2xl hover:scale-105 transition-all flex items-center gap-3 z-50">
                New Hub Project <Plus className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {step === 'input' && selectedTemplates.length > 0 && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <button 
                onClick={() => setStep('select')}
                className="flex items-center text-sm text-brand-ink/40 hover:text-brand-ink transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to templates
              </button>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedTemplates.map(t => (
                    <div key={t.title} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      <TemplateIcon id={t.title} className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">{t.title}</span>
                    </div>
                  ))}
                </div>
                <h2 className="text-4xl font-display font-bold">Content Brief</h2>
                <p className="text-gray-500 font-light">What should we create today? Provide a topic or a brief description.</p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. The future of sustainable fashion in 2026..."
                    className="w-full h-48 bg-white border border-black/5 rounded-[2rem] p-8 text-xl font-light focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none placeholder:text-gray-200 shadow-sm"
                  />
                  <div className="absolute bottom-6 right-8 text-xs text-gray-300 font-mono">
                    {topic.length} characters
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!topic || isGenerating}
                  className={cn(
                    "w-full py-6 rounded-full text-lg font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg",
                    isGenerating 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-brand-ink text-white hover:bg-black active:scale-[0.98]"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Generating {selectedTemplates.length} Pieces...
                    </>
                  ) : (
                    <>
                      Generate All Content
                      <Sparkles className="w-6 h-6" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'result' && results.length > 0 && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" /> {results.length} Pieces Generated
                  </div>
                  <h2 className="text-4xl font-display font-bold">{topic}</h2>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setStep('canvas')}
                    className="flex items-center gap-2 px-8 py-4 bg-white border border-black/5 rounded-2xl hover:bg-gray-50 transition-all text-brand-ink font-bold uppercase tracking-widest text-sm shadow-sm"
                  >
                    <Layout className="w-5 h-5" />
                    Open Canvas
                  </button>
                  <button 
                    onClick={reset}
                    className="px-8 py-4 bg-brand-ink text-white rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-black transition-all shadow-lg"
                  >
                    New Project
                  </button>
                </div>
              </div>

              <div className="space-y-24">
                {results.map((result, index) => (
                  <motion.div 
                    key={result.template.title}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-4 border-b border-black/5 pb-6">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <TemplateIcon id={result.template.title} className="w-8 h-8 text-brand-ink" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-display font-bold">{result.template.title}</h3>
                        <p className="text-gray-400 text-sm font-light">{result.template.description}</p>
                      </div>
                      <div className="ml-auto flex gap-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(result.text);
                            alert("Copied to clipboard!");
                          }}
                          className="p-3 bg-white border border-black/5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm" title="Copy Text">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Main Content */}
                      <div className="lg:col-span-2 space-y-8">
                        {result.imageUrl && (
                          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-white border border-black/5 shadow-sm">
                            <img 
                              src={result.imageUrl} 
                              alt="Generated visual" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
                                <ImageIcon className="w-4 h-4" /> AI GENERATED VISUAL
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="bg-white rounded-[2.5rem] p-12 border border-black/5 shadow-sm">
                          <div className="prose prose-emerald max-w-none">
                            <Markdown>{result.text}</Markdown>
                          </div>
                        </div>
                      </div>

                      {/* Sidebar Analytics */}
                      <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 space-y-8 border border-black/5 shadow-sm">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                            <BarChart3 className="w-4 h-4" /> Insights
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl bg-gray-50 border border-black/5">
                              <div className="text-3xl font-display font-bold">{result.analytics.wordCount}</div>
                              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-300">Words</div>
                            </div>
                            <div className="p-5 rounded-2xl bg-gray-50 border border-black/5">
                              <div className="text-3xl font-display font-bold">{result.analytics.readingTime}m</div>
                              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-300">Read Time</div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Tone</div>
                            <div className="flex items-center justify-between p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                              <span className="font-bold text-emerald-700">{result.analytics.sentiment}</span>
                              <Sparkles className="w-4 h-4 text-emerald-500" />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Keywords</div>
                            <div className="flex flex-wrap gap-2">
                              {result.analytics.keywords.map((kw, i) => (
                                <span key={i} className="px-4 py-1.5 rounded-full bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400 border border-black/5">
                                  #{kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'canvas' && (
            <CanvasEditor 
              initialContent={results} 
              onClose={() => setStep('select')} 
            />
          )}

          {step === 'editor' && (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-160px)]"
            >
              {isInitializing && (
                <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-[2.5rem]">
                  <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                  <p className="text-xl font-display font-bold text-brand-ink">Initializing Studio...</p>
                  <p className="text-sm text-gray-400 italic">Crafting your custom campaign manuscript and visuals</p>
                </div>
              )}
              {/* Manuscript Editor */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-black/5 flex flex-col overflow-hidden">
                <div className="px-8 py-6 border-b border-black/5 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Manuscript Editor</span>
                  <div className="flex items-center gap-3 text-gray-300">
                    <button className="hover:text-brand-ink transition-colors font-bold text-sm">B</button>
                    <span className="text-gray-200">/</span>
                    <button className="hover:text-brand-ink transition-colors"><Layout className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-gray-100 mx-1" />
                    <button className="hover:text-brand-ink transition-colors"><BarChart3 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex-1 p-12 overflow-y-auto space-y-8">
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Title of your piece..." 
                    className="w-full text-5xl font-display font-light text-gray-300 focus:outline-none focus:text-brand-ink transition-colors"
                  />
                  <textarea
                    value={manuscript}
                    onChange={(e) => setManuscript(e.target.value)}
                    className="w-full h-full text-lg font-light leading-relaxed text-gray-500 focus:outline-none resize-none"
                    placeholder="Start writing..."
                  />
                </div>
                <div className="px-8 py-6 border-t border-black/5 flex justify-between items-center bg-gray-50/30">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                    Word Count: {manuscript.split(/\s+/).filter(Boolean).length}
                  </div>
                  <button className="bg-emerald-50/50 text-emerald-600 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100/50">
                    Refine with AI
                  </button>
                </div>
              </div>

              {/* Visual Generation */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-black/5 flex flex-col overflow-hidden">
                <div className="px-8 py-6 border-b border-black/5 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Visual Generation</span>
                  <div className="flex items-center gap-3 text-gray-300">
                    <button className="hover:text-brand-ink transition-colors"><Layout className="w-4 h-4" /></button>
                    <button className="hover:text-brand-ink transition-colors"><BarChart3 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex-1 p-8 overflow-y-auto space-y-6">
                  {/* Image Gallery */}
                  <div className="space-y-6">
                    {generatedImages.length > 0 && (
                      <div className="relative rounded-[2rem] overflow-hidden group">
                        <img src={generatedImages[0].url} alt="Main generation" className="w-full aspect-video object-cover" />
                        <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] text-gray-500 leading-relaxed font-light">
                            Prompt: {generatedImages[0].prompt}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-6">
                      {generatedImages.slice(1).map((img, i) => (
                        <div key={i} className="rounded-[2rem] overflow-hidden aspect-square bg-gray-50">
                          <img src={img.url} alt={`Gen ${i}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="space-y-6 pt-4">
                    <div className="bg-gray-50 rounded-[2rem] p-6 border border-black/5">
                      <textarea
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Describe the image you wish to manifest..."
                        className="w-full bg-transparent text-sm font-light text-gray-500 focus:outline-none resize-none h-20"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !imagePrompt}
                        className="flex-1 bg-brand-ink text-white py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
                      >
                        {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Generate Visual
                      </button>
                      <button className="p-4 bg-white border border-black/5 rounded-full shadow-sm hover:bg-gray-50 transition-colors">
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Charles Eames Quote */}
                  <div className="pt-8 flex flex-col items-center text-center space-y-2 opacity-30">
                    <p className="text-sm font-display italic text-gray-500">
                      "Details are not the details. They make the design."
                    </p>
                    <span className="text-[8px] font-bold uppercase tracking-widest">— Charles Eames</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h1 className="text-7xl font-display font-bold tracking-tighter uppercase leading-tight">Campaign <span className="text-gray-300 italic font-light">History</span></h1>
                <p className="text-gray-400 font-light">Revisit and refine your previous AI-powered marketing campaigns.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {history.length === 0 ? (
                  <div className="col-span-full py-32 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                    <p className="text-gray-300 italic font-light">No campaigns found. Start creating to build your history.</p>
                  </div>
                ) : (
                  history.map((campaign) => (
                    <motion.button
                      key={campaign.id}
                      whileHover={{ y: -4 }}
                      onClick={() => {
                        setTopic(campaign.topic);
                        setResults(campaign.results);
                        setStep('result');
                      }}
                      className="p-10 bg-white rounded-[2.5rem] text-left hover:shadow-xl transition-all flex justify-between items-center group border border-black/5 shadow-sm"
                    >
                      <div className="space-y-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </div>
                        <h3 className="text-3xl font-display font-bold group-hover:text-emerald-500 transition-colors">
                          {campaign.topic}
                        </h3>
                        <div className="flex gap-2">
                          {campaign.results.map((r: any) => (
                            <div key={r.template.title} className="p-2 bg-gray-50 rounded-xl border border-black/5">
                              <TemplateIcon id={r.template.title} className="w-4 h-4 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="w-8 h-8 text-gray-100 group-hover:text-emerald-500 transition-colors" />
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 py-12 px-10 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-20">
            <Sparkles className="w-4 h-4" />
            <span className="font-display font-bold">AI Studio</span>
          </div>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-gray-300">
            <a href="#" className="hover:text-brand-ink transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-ink transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-ink transition-colors">Contact</a>
          </div>
          <div className="text-[10px] text-gray-300 font-mono uppercase tracking-widest">
            © 2026 AI CREATIVE STUDIO. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
