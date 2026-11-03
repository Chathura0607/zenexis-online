'use client';

import React, { useState } from 'react';
import {
  CameraIcon,
  UploadCloudIcon,
  SparklesIcon,
  BookOpenIcon,
  CheckIcon,
  PlusIcon,
  ClockIcon,
  MapPinIcon,
  WhatsAppIcon,
  ShieldCheckIcon,
  XIcon,
} from './icons';
import { SHOP_CONFIG, SCHOOL_GRADES } from '@/lib/constants';
import { parseHandwrittenBooklistWithAI, AIParsedBooklist } from '@/lib/gemini';
import { createSchoolRequest } from '@/lib/storage';
import { generateSchoolRequestWhatsAppMessage, createWhatsAppUrl } from '@/lib/whatsapp';
import { SchoolListRequest } from '@/types';

export const SchoolSeasonSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'bundles'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<AIParsedBooklist | null>(null);

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [studentName, setStudentName] = useState('');
  const [schoolGrade, setSchoolGrade] = useState(SCHOOL_GRADES[4]);
  const [schoolName, setSchoolName] = useState('');
  const [notes, setNotes] = useState('');
  const [missingItemInput, setMissingItemInput] = useState('');
  const [missingItems, setMissingItems] = useState<string[]>([]);

  // Submitted request result
  const [submittedRequest, setSubmittedRequest] = useState<SchoolListRequest | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setAnalyzedData(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    try {
      const result = await parseHandwrittenBooklistWithAI(imagePreview, `${schoolGrade} ${notes}`);
      setAnalyzedData(result);
    } catch (err) {
      console.error(err);
      alert('Could not parse image. Please fill details or submit photo directly to our WhatsApp.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddMissingItem = () => {
    if (missingItemInput.trim()) {
      setMissingItems([...missingItems, missingItemInput.trim()]);
      setMissingItemInput('');
    }
  };

  const handleRemoveMissingItem = (index: number) => {
    setMissingItems(missingItems.filter((_, i) => i !== index));
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) {
      alert('Please provide your name and phone number so we can notify you when your booklist is ready.');
      return;
    }

    const parsedItems = analyzedData
      ? analyzedData.items
      : [
          { name: 'Standard Grade ' + schoolGrade + ' Book Package', quantity: 1, available: true, unitPrice: 4500 },
        ];

    const quotedTotal = analyzedData?.estimatedTotal || 5000;
    const discount = analyzedData?.suggestedDiscount || Math.round((quotedTotal * 10) / 100);
    const finalTotal = analyzedData?.finalTotal || (quotedTotal - discount);

    const newReq = createSchoolRequest({
      customerName: customerName.trim(),
      phone: phone.trim(),
      studentName: studentName.trim() || undefined,
      schoolGrade,
      schoolName: schoolName.trim() || undefined,
      handwrittenImageUrl: imagePreview || undefined,
      parsedItems,
      missingItemsRequested: missingItems,
      notes: notes.trim() || undefined,
      status: 'pending_review',
      quotedTotal,
      discount,
      finalTotal,
      scheduledPickupDate: analyzedData?.recommendedReadyDate || new Date().toISOString().split('T')[0],
      scheduledPickupTime: analyzedData?.recommendedTimeSlot || '10:00 AM - 12:00 PM',
    });

    setSubmittedRequest(newReq);
  };

  return (
    <section id="school-season" className="py-12 sm:py-16 bg-slate-950/60 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
            <span>🎒</span>
            <span>School Term & Season Ordering Hub</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
              10% OFF
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Skip the Shop Crowds & Queues!
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
            Upload a photo of your child&apos;s handwritten school book list. Our AI and team prepare everything beforehand with special discounts. Just walk in and collect at your chosen time slot!
          </p>

          {/* Tab Selector */}
          <div className="mt-6 inline-flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CameraIcon className="w-4 h-4" />
              <span>Upload Handwritten Booklist</span>
            </button>
            <button
              onClick={() => setActiveTab('bundles')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'bundles'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpenIcon className="w-4 h-4" />
              <span>Standard Grade Bundles</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Upload & AI Analyzer */}
        {activeTab === 'upload' && (
          <div className="max-w-4xl mx-auto">
            {submittedRequest ? (
              <div className="bg-slate-900/90 border border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <CheckIcon className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="text-2xl font-black text-white">
                  Booklist Request #{submittedRequest.requestNumber} Received!
                </h3>
                <p className="text-sm text-slate-300 max-w-lg mx-auto">
                  Thank you <strong>{submittedRequest.customerName}</strong>! Your school book list has been scheduled.
                </p>

                {/* Estimation Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-left text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Estimated Total:</span>
                    <span className="text-base font-bold text-white">
                      Rs. {submittedRequest.quotedTotal?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-400 block mb-1">10% Season Discount:</span>
                    <span className="text-base font-bold text-emerald-400">
                      -Rs. {submittedRequest.discount?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Final Amount:</span>
                    <span className="text-lg font-black text-cyan-400">
                      Rs. {submittedRequest.finalTotal?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Pickup Date & Slot */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <ClockIcon className="w-4 h-4 text-amber-400" />
                    <span>Scheduled Collection Time Slot:</span>
                  </div>
                  <p className="text-slate-200">
                    Ready on: <strong>{submittedRequest.scheduledPickupDate}</strong> between <strong>{submittedRequest.scheduledPickupTime}</strong>
                  </p>
                  <p className="text-slate-400 text-[11px] flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pickup Location: Zenexis Showroom - Ambalangoda</span>
                  </p>
                </div>

                {/* WhatsApp Action */}
                <div className="space-y-3">
                  <a
                    href={createWhatsAppUrl(
                      SHOP_CONFIG.whatsappNumber,
                      generateSchoolRequestWhatsAppMessage(submittedRequest)
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-sm shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition"
                  >
                    <WhatsAppIcon className="w-5 h-5 fill-white" />
                    <span>Confirm & Send via WhatsApp to 0701120945</span>
                  </a>
                  <p className="text-[11px] text-slate-400">
                    Our Ambalangoda team will pack your books and notify you when ready!
                  </p>
                  <button
                    onClick={() => {
                      setSubmittedRequest(null);
                      setImagePreview(null);
                      setAnalyzedData(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white underline block mx-auto pt-2"
                  >
                    Submit another list
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6">
                {/* Upload Area */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    1. Upload or Take Photo of Handwritten Booklist:
                  </label>
                  <div className="relative border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-2xl p-6 text-center transition bg-slate-950/40">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <div className="relative max-h-64 mx-auto rounded-xl overflow-hidden border border-slate-800 bg-slate-900 inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imagePreview}
                            alt="Booklist Preview"
                            className="max-h-64 object-contain mx-auto"
                          />
                          <button
                            onClick={() => {
                              setImagePreview(null);
                              setAnalyzedData(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-slate-950/80 rounded-full text-slate-300 hover:text-white"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>

                        {!analyzedData && (
                          <div>
                            <button
                              type="button"
                              onClick={handleAnalyzePhoto}
                              disabled={isAnalyzing}
                              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center gap-2 mx-auto"
                            >
                              <SparklesIcon className="w-4 h-4" />
                              <span>
                                {isAnalyzing ? 'AI Analyzing Booklist...' : 'Analyze Booklist with AI'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <label className="cursor-pointer block space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                          <UploadCloudIcon className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            Click to Upload Photo or Capture from Mobile
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Snap handwritten paper list from school or teacher
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* AI Extracted Items Table (If analyzed) */}
                {analyzedData && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-cyan-400">
                        <SparklesIcon className="w-4 h-4" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                          AI Parsed Items & Estimated Quote
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                        {analyzedData.studentGrade}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800 text-xs">
                      {analyzedData.items.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-4 text-slate-500 font-mono">{idx + 1}.</span>
                            <span className="text-white font-medium">{item.name}</span>
                            <span className="text-slate-400 font-light">x{item.quantity}</span>
                          </div>
                          <span className="text-slate-300 font-semibold shrink-0">
                            Rs. {(item.quantity * item.unitPrice).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Cost Breakdown */}
                    <div className="pt-3 border-t border-slate-800 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>List Total:</span>
                        <span>Rs. {analyzedData.estimatedTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-amber-400 font-semibold">
                        <span>Season Discount (10%):</span>
                        <span>-Rs. {analyzedData.suggestedDiscount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-800/80">
                        <span>Discounted Total:</span>
                        <span className="text-cyan-400 text-base">
                          Rs. {analyzedData.finalTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Suggested Pickup Slot */}
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        Recommended Ready Date: <strong>{analyzedData.recommendedReadyDate}</strong> ({analyzedData.recommendedTimeSlot})
                      </span>
                    </div>
                  </div>
                )}

                {/* Missing Items Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    2. Any specific or missing items not on the regular list?
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    If there is an uncommon atlas, specific brand of water colors, or items we should source for you, write here:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={missingItemInput}
                      onChange={(e) => setMissingItemInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMissingItem();
                        }
                      }}
                      placeholder="e.g. Cambridge School Atlas Sinhala, Camel poster colors 12s..."
                      className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddMissingItem}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {missingItems.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {missingItems.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMissingItem(idx)}
                            className="text-amber-400 hover:text-white"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Information Form */}
                <form onSubmit={handleSubmitRequest} className="space-y-4 pt-4 border-t border-slate-800">
                  <label className="block text-xs font-bold text-slate-300">
                    3. Contact Details for Pickup Notification:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Parent / Customer Name *"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="WhatsApp / Phone Number (0701120945) *"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Student Name (Optional)"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <select
                        value={schoolGrade}
                        onChange={(e) => setSchoolGrade(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        {SCHOOL_GRADES.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional instructions (e.g. prefer Atlas brand books only, blue pens only)"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2"
                  >
                    <span>Submit Booklist Order & Lock Ready Time Slot</span>
                    <WhatsAppIcon className="w-5 h-5 fill-slate-950" />
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                    <span>Prepared at Zenexis Showroom • Ambalangoda</span>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Standard Bundles */}
        {activeTab === 'bundles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Primary Bundle */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  Primary Pack
                </span>
                <h3 className="text-xl font-black text-white mt-3">
                  Grade 1 - 5 Complete Stationery Kit
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  All textbooks, CR 80pg single rule, square math books, color pencils & essentials.
                </p>

                <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                    <span>6x Atlas CR 80pg Single Rule</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                    <span>2x Atlas CR 80pg Square Rule</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                    <span>1x Drawing Book 40 Pages</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                    <span>1x Faber-Castell 12 Color Pencils Box</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                    <span>3x Pencils + Eraser + Sharpener + Ruler</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-white">Rs. 4,950</span>
                  <span className="text-xs text-slate-500 line-through ml-2">Rs. 5,800</span>
                </div>
                <a
                  href={createWhatsAppUrl(
                    SHOP_CONFIG.whatsappNumber,
                    'Hello Zenexis! I want to order the Grade 1-5 Primary Complete Stationery Kit (Rs. 4,950).'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-slate-950" />
                  <span>Order Bundle</span>
                </a>
              </div>
            </div>

            {/* Secondary Bundle */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                  Secondary / O/L Pack
                </span>
                <h3 className="text-xl font-black text-white mt-3">
                  Grade 6 - 11 Complete Term Pack
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  10x CR 120pg books, geometry math box, blue pen packs, files & paper reams.
                </p>

                <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                    <span>10x Atlas CR 120pg Single Rule</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                    <span>2x Atlas CR 120pg Square Rule</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                    <span>1x Faber-Castell Math Geometry Box</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                    <span>1x Reynolds 10-Pen Blue Pack + 2 Red</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                    <span>A4 Assignment Folders & 30cm Steel Ruler</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-white">Rs. 7,800</span>
                  <span className="text-xs text-slate-500 line-through ml-2">Rs. 9,200</span>
                </div>
                <a
                  href={createWhatsAppUrl(
                    SHOP_CONFIG.whatsappNumber,
                    'Hello Zenexis! I want to order the Secondary Grade 6-11 Term Pack (Rs. 7,800).'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-slate-950" />
                  <span>Order Bundle</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

