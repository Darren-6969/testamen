'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import { Database, Save, X } from 'lucide-react';
import { toast } from 'sonner';

// Import your creation API handler
import { createStorage } from '@/app/data/storage';

export default function AddStoragePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    feature_plan: '',
    storage_mb: '',
    price_rm: '',
    status: 'Active', 
  });

  // Handle Input Changes safely
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation Guard rails
    if (!formData.feature_plan.trim()) {
      toast.error('Please enter a Plan Name');
      return;
    }
    if (!formData.storage_mb || Number(formData.storage_mb) <= 0) {
      toast.error('Please enter a valid storage capacity in MB');
      return;
    }
    if (!formData.price_rm || Number(formData.price_rm) < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsSubmitting(true);

    try {
      // Structure payload matching backend criteria
      await createStorage({
        feature_plan: formData.feature_plan.trim(),
        storage_mb: Number(formData.storage_mb),
        price_rm: Number(formData.price_rm),
        status: formData.status,
      });

      toast.success('New storage plan created successfully!');
      
      // --- THE CRITICAL SEQUENCE FIX ---
      router.refresh();                 
      router.push('/module/storage'); 
      
    } catch (err) {
      toast.error('Failed to create storage plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 mx-auto">
      {/* Page Header with Quick Back Navigation */}
      <div className="flex items-center justify-between">
        <PageHeader icon={<Database className="w-5 h-5 text-[#c3195d]" />}>
          <span className="text-[#c3195d]">Add New Storage Plan</span>
        </PageHeader>
      </div>

      {/* Main Form Layout mapped exactly to the template UI structure */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
      >
        {/* Form Header Contextual Styling */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-pink-50 via-white to-white px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">
            Storage Details
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Configure the parameters, storage limitations, pricing structures, and system environments.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Plan Name Field */}
          <div className="space-y-2">
            <label htmlFor="feature_plan" className="text-sm font-bold text-slate-700 block">
              Plan Name <span className="text-[#c3195d]">*</span>
            </label>
            <input
              type="text"
              id="feature_plan"
              name="feature_plan"
              value={formData.feature_plan}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g., Pro, Enterprise"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10 disabled:cursor-not-allowed disabled:opacity-60"
              required
            />
          </div>

          {/* Grid Layout for Capacity & Pricing */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Storage Field */}
            <div className="space-y-2">
              <label htmlFor="storage_mb" className="text-sm font-bold text-slate-700 block">
                Storage Capacity (MB) <span className="text-[#c3195d]">*</span>
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <input
                  type="number"
                  id="storage_mb"
                  name="storage_mb"
                  value={formData.storage_mb}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="2048"
                  min="1"
                  className="w-full rounded-2xl border border-slate-200 bg-white pr-12 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xs font-semibold">MB</span>
                </div>
              </div>
            </div>

            {/* Pricing Field */}
            <div className="space-y-2">
              <label htmlFor="price_rm" className="text-sm font-bold text-slate-700 block">
                Pricing (RM) <span className="text-[#c3195d]">*</span>
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xs font-semibold">RM</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  id="price_rm"
                  name="price_rm"
                  value={formData.price_rm}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="0.00"
                  min="0"
                  className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  required
                />
              </div>
            </div>
          </div>

          {/* Status Selection Box */}
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-bold text-slate-700 block">
              Initial Deployment Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Action Buttons styled precisely to the targeted design layout */}
        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => router.push('/module/storage')}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#c3195d]/20 bg-gradient-to-r from-[#c3195d] to-[#a5124b] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-900/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Saving Plan...' : 'Save Storage Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}