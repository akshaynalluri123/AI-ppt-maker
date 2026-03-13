/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Presentation, 
  User, 
  IdCard, 
  School, 
  Type, 
  Layers, 
  MessageSquare, 
  Image as ImageIcon, 
  Download, 
  Sparkles, 
  Trash2, 
  Plus,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GeneratorSettings, SlideContent, PresentationData } from './types';
import { generateSlideContent, generateSlideImage } from './services/geminiService';
import { createPptx } from './utils/pptxExport';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [isDark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [settings, setSettings] = useState<GeneratorSettings>({
    userName: '',
    rollNumber: '',
    collegeName: '',
    topic: '',
    slideLimit: 5,
    customPrompt: '',
    showLogo: true,
    autoGenerateImages: false,
    preUploadedImages: [],
  });
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, customLogoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreImages = [...(settings.preUploadedImages || [])];
        // Ensure array is long enough
        while (newPreImages.length <= index) {
          newPreImages.push('');
        }
        newPreImages[index] = reader.result as string;
        setSettings({ ...settings, preUploadedImages: newPreImages });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePreImage = (index: number) => {
    const newPreImages = [...(settings.preUploadedImages || [])];
    newPreImages[index] = '';
    setSettings({ ...settings, preUploadedImages: newPreImages });
  };

  const removeLogo = () => {
    setSettings({ ...settings, customLogoUrl: undefined });
  };

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const handleGenerate = async () => {
    if (!settings.topic || !settings.userName) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const generatedSlides = await generateSlideContent(settings);
      
      const slidesWithImages = await Promise.all(generatedSlides.map(async (slide, idx) => {
        // 1. Use pre-uploaded image if available
        if (settings.preUploadedImages?.[idx]) {
          return { ...slide, imageUrl: settings.preUploadedImages[idx] };
        }

        // 2. Otherwise auto-generate if enabled
        if (settings.autoGenerateImages && slide.imagePrompt) {
          try {
            const imageUrl = await generateSlideImage(slide.imagePrompt);
            return { ...slide, imageUrl };
          } catch (e) {
            console.error("Auto image generation failed for slide", slide.title, e);
            return slide;
          }
        }
        return slide;
      }));

      setSlides(slidesWithImages);
      setStep('preview');
    } catch (error: any) {
      console.error("Generation failed", error);
      setError(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddImage = async (index: number) => {
    const slide = slides[index];
    if (!slide.imagePrompt) return;

    setGeneratingImages(prev => ({ ...prev, [index]: true }));
    try {
      const imageUrl = await generateSlideImage(slide.imagePrompt);
      if (imageUrl) {
        const newSlides = [...slides];
        newSlides[index] = { ...slide, imageUrl };
        setSlides(newSlides);
      }
    } catch (error) {
      console.error("Image generation failed", error);
    } finally {
      setGeneratingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleRemoveImage = (index: number) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], imageUrl: undefined };
    setSlides(newSlides);
  };

  const handleSlideImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newSlides = [...slides];
        newSlides[index] = { ...newSlides[index], imageUrl: reader.result as string };
        setSlides(newSlides);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    const data: PresentationData = {
      userName: settings.userName,
      rollNumber: settings.rollNumber,
      collegeName: settings.collegeName,
      topic: settings.topic,
      slides: slides,
      customLogoUrl: settings.customLogoUrl
    };
    await createPptx(data, settings);
  };

  return (
    <div className="min-h-screen font-sans">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/20">
              <Presentation size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight dark:text-white">AI PPT Gen</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium transition-all hover:bg-neutral-50 dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-900"
            >
              <CheckCircle2 size={16} className="text-green-600" />
              Sharing Info
            </button>
          </div>
        </div>
      </nav>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-8 shadow-2xl dark:bg-neutral-900"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold dark:text-white">How to Share</h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <X size={20} className="dark:text-white" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm leading-relaxed text-red-700 dark:text-red-300">
                    <strong>Important:</strong> Do not share the URL in your browser's address bar. That is your private development URL and will show a <strong>"Forbidden"</strong> message to others.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">1</div>
                    <div>
                      <p className="font-semibold dark:text-white">Click "Share" in AI Studio</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Look for the Share button in the top right of the AI Studio Build interface.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">2</div>
                    <div>
                      <p className="font-semibold dark:text-white">Copy the "Shared App URL"</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">This URL is public and works for everyone on any device.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">3</div>
                    <div>
                      <p className="font-semibold dark:text-white">No API Key Issues</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">The shared app automatically uses the platform's API key. No manual setup required for your users.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full rounded-xl bg-red-600 py-3 font-bold text-white transition-all hover:bg-red-700"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-3xl"
            >
              <div className="mb-12 text-center">
                <motion.h1 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 font-display text-5xl font-bold tracking-tight sm:text-6xl dark:text-white"
                >
                  Create Stunning <span className="text-red-600">Presentations</span> in Seconds
                </motion.h1>
                <p className="text-lg text-neutral-600 dark:text-neutral-400">
                  Powered by Advanced AI. Created by <span className="font-semibold text-red-600">Akshay Nalluri</span>.
                </p>
              </div>

              <div className="grid gap-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-2xl shadow-neutral-200/50 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      <User size={16} className="text-red-600" /> Full Name
                    </label>
                    <input
                      type="text"
                      value={settings.userName}
                      onChange={(e) => setSettings({ ...settings, userName: e.target.value })}
                      placeholder="e.g. Akshay Nalluri"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none transition-all focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      <IdCard size={16} className="text-red-600" /> Roll Number
                    </label>
                    <input
                      type="text"
                      value={settings.rollNumber}
                      onChange={(e) => setSettings({ ...settings, rollNumber: e.target.value })}
                      placeholder="e.g. 21951A0501"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none transition-all focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <School size={16} className="text-red-600" /> College Name
                  </label>
                  <input
                    type="text"
                    value={settings.collegeName}
                    onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
                    placeholder="e.g. IARE"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none transition-all focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <Type size={16} className="text-red-600" /> Presentation Topic
                  </label>
                  <input
                    type="text"
                    value={settings.topic}
                    onChange={(e) => setSettings({ ...settings, topic: e.target.value })}
                    placeholder="e.g. The Future of Quantum Computing"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none transition-all focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      <Layers size={16} className="text-red-600" /> Number of Slides
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={settings.slideLimit}
                      onChange={(e) => setSettings({ ...settings, slideLimit: parseInt(e.target.value) })}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none transition-all focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={settings.showLogo}
                          onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                          className="peer sr-only"
                        />
                        <div className="h-6 w-11 rounded-full bg-neutral-200 transition-all peer-checked:bg-red-600 dark:bg-neutral-700"></div>
                        <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:translate-x-5"></div>
                      </div>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Include Logo on Slides</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-3">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={settings.autoGenerateImages}
                          onChange={(e) => setSettings({ ...settings, autoGenerateImages: e.target.checked })}
                          className="peer sr-only"
                        />
                        <div className="h-6 w-11 rounded-full bg-neutral-200 transition-all peer-checked:bg-red-600 dark:bg-neutral-700"></div>
                        <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:translate-x-5"></div>
                      </div>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Auto-generate Images</span>
                    </label>

                    {settings.showLogo && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          <ImageIcon size={16} className="text-red-600" /> College Logo (IARE)
                        </label>
                        <div className="flex items-center gap-3">
                          {settings.customLogoUrl ? (
                            <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                              <img src={settings.customLogoUrl} alt="Logo Preview" className="h-full w-full object-contain" />
                              <button 
                                onClick={removeLogo}
                                className="absolute top-0 right-0 rounded-bl-lg bg-red-600 p-1 text-white hover:bg-red-700"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ) : (
                            <label className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 transition-all hover:border-red-600 hover:bg-red-50 dark:border-neutral-700 dark:bg-neutral-800">
                              <span className="text-xs text-neutral-500">Upload College Logo</span>
                              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <ImageIcon size={16} className="text-red-600" /> Upload Images for Slides (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                    {Array.from({ length: settings.slideLimit }).map((_, idx) => (
                      <div key={idx} className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-neutral-500">Slide {idx + 1}</span>
                        {settings.preUploadedImages?.[idx] ? (
                          <div className="relative aspect-video overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                            <img src={settings.preUploadedImages[idx]} alt={`Slide ${idx + 1}`} className="h-full w-full object-cover" />
                            <button 
                              onClick={() => removePreImage(idx)}
                              className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex aspect-video cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 transition-all hover:border-red-600 hover:bg-red-50 dark:border-neutral-700 dark:bg-neutral-800">
                            <Plus size={16} className="text-neutral-400" />
                            <input type="file" accept="image/*" onChange={(e) => handlePreImageUpload(idx, e)} className="hidden" />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <MessageSquare size={16} className="text-red-600" /> Custom Instructions (Optional)
                  </label>
                  <textarea
                    value={settings.customPrompt}
                    onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
                    placeholder="Add specific details you want the AI to include..."
                    rows={3}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none transition-all focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    <X size={18} className="shrink-0 cursor-pointer" onClick={() => setError(null)} />
                    <p>{error}</p>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !settings.topic || !settings.userName}
                  className="group relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-red-600 py-4 font-bold text-white shadow-xl shadow-red-600/30 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Generate Presentation
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-display text-3xl font-bold dark:text-white">Review Your Slides</h2>
                  <p className="text-neutral-600 dark:text-neutral-400">Add images or edit content before downloading.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('form')}
                    className="rounded-xl border border-neutral-200 bg-white px-6 py-3 font-semibold text-neutral-700 transition-all hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700"
                  >
                    <Download size={20} />
                    Download PPTX
                  </button>
                </div>
              </div>

              <div className="grid gap-8">
                {/* Intro Slide Preview */}
                <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="bg-neutral-100 px-6 py-3 dark:bg-neutral-800/50">
                    <span className="text-sm font-bold uppercase tracking-wider text-neutral-500">Slide 1: Introduction</span>
                  </div>
                  <div className="relative aspect-video bg-white p-12 text-center">
                    {settings.showLogo && (
                      <div className="absolute top-6 right-6">
                        {settings.customLogoUrl ? (
                          <img src={settings.customLogoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                        ) : (
                          <div className="text-xl font-bold text-red-600">IARE</div>
                        )}
                      </div>
                    )}
                    <div className="flex h-full flex-col items-center justify-center space-y-6">
                      <h3 className="text-5xl font-bold text-neutral-900">{settings.topic}</h3>
                      <div className="space-y-2">
                        <p className="text-2xl text-neutral-600">Presented by: {settings.userName}</p>
                        <p className="text-lg text-neutral-500">Roll Number: {settings.rollNumber}</p>
                        <p className="text-lg text-neutral-500">{settings.collegeName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Slides Preview */}
                {slides.map((slide, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <div className="flex items-center justify-between bg-neutral-100 px-6 py-3 dark:bg-neutral-800/50">
                      <span className="text-sm font-bold uppercase tracking-wider text-neutral-500">Slide {idx + 2}</span>
                      <div className="flex gap-2">
                        {!slide.imageUrl ? (
                          <>
                            <button
                              onClick={() => handleAddImage(idx)}
                              disabled={generatingImages[idx]}
                              className="flex items-center gap-2 rounded-lg bg-red-600/10 px-3 py-1.5 text-xs font-bold text-red-600 transition-all hover:bg-red-600/20 disabled:opacity-50"
                            >
                              {generatingImages[idx] ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Plus size={14} />
                              )}
                              Add AI Image
                            </button>
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-neutral-600/10 px-3 py-1.5 text-xs font-bold text-neutral-600 transition-all hover:bg-neutral-600/20">
                              <ImageIcon size={14} />
                              Upload Image
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleSlideImageUpload(idx, e)} 
                              />
                            </label>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRemoveImage(idx)}
                            className="flex items-center gap-2 rounded-lg bg-red-600/10 px-3 py-1.5 text-xs font-bold text-red-600 transition-all hover:bg-red-600/20"
                          >
                            <Trash2 size={14} />
                            Remove Image
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative aspect-video bg-white p-12">
                      {settings.showLogo && (
                        <div className="absolute top-6 right-6">
                          {settings.customLogoUrl ? (
                            <img src={settings.customLogoUrl} alt="Logo" className="h-10 w-auto object-contain" />
                          ) : (
                            <div className="text-lg font-bold text-red-600">IARE</div>
                          )}
                        </div>
                      )}
                      <div className="mb-4">
                        <h3 className="text-3xl font-bold text-neutral-900">{slide.title}</h3>
                        <div className="mt-2 h-1.5 w-32 bg-red-600"></div>
                      </div>
                      <div className="flex gap-8">
                        <ul className="flex-1 space-y-4">
                          {slide.points.map((point, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-3 text-neutral-700">
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-600"></span>
                              <span className="text-lg leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                        {slide.imageUrl && (
                          <div className="w-1/3 shrink-0">
                            <img 
                              src={slide.imageUrl} 
                              alt="Slide Visual" 
                              className="h-full w-full rounded-2xl object-cover shadow-lg"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center pb-12">
                <button
                  onClick={handleDownload}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-red-600 px-12 py-5 text-xl font-bold text-white shadow-2xl shadow-red-600/30 transition-all hover:bg-red-700 active:scale-95"
                >
                  <Download size={24} />
                  Download Final Presentation
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8 dark:border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-neutral-500 dark:text-neutral-400">
            Created with ❤️ by <span className="font-bold text-red-600">Akshay Nalluri</span>
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            © 2026 AI PPT Generator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
