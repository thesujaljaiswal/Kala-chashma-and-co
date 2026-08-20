"use client";

import { useState, useEffect, use } from "react";
import { getFormByShareId, submitFormResponse, uploadImageToCloudinary } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";
import DefaultTheme from "@/components/forms/themes/default";
import FightClubTheme from "@/components/forms/themes/fight-club";

export default function PublicFormPage({ params }: { params: Promise<{ shareId: string }> }) {
  const unwrappedParams = use(params);
  const [form, setForm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorField, setErrorField] = useState<string | null>(null);
  const [showUndertakingModal, setShowUndertakingModal] = useState(false);
  const [currentUndertakingField, setCurrentUndertakingField] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      const data = await getFormByShareId(unwrappedParams.shareId);
      if (data) setForm(data);
      setIsLoading(false);
    };
    fetchForm();
  }, [unwrappedParams.shareId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setErrorField(null);
    setErrorMsg("");

    // Validate required fields and undertakings
    for (const field of form.fields) {
      if (field.required && !responses[field.label]?.trim()) {
        setErrorMsg(`Please answer: ${field.label}`);
        setErrorField(field.label);
        document.getElementById(`field-${field.label.replace(/\s+/g, '-')}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      
      if (field.type === 'undertaking' && responses[field.label] !== 'Accepted') {
        setErrorMsg(`You must accept the undertaking: ${field.label}`);
        setErrorField(field.label);
        document.getElementById(`field-${field.label.replace(/\s+/g, '-')}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    setIsSubmitting(true);

    if (form.isPaymentEnabled && form.paymentAmount > 0 && !paymentConfirmed) {
      setErrorMsg("Please confirm that you have made the payment by checking the box.");
      return;
    }

    setIsSubmitting(true);

    try {
      const responsesArray = [];
      for (const field of form.fields) {
        let value = responses[field.label];
        
        if (field.type === 'file' && value && value.startsWith('data:image')) {
          const uploadResult = await uploadImageToCloudinary(value);
          if (uploadResult.success) {
            value = uploadResult.url as string;
          } else {
            setErrorMsg(`Failed to upload file for ${field.label}. Please try again.`);
            setIsSubmitting(false);
            return;
          }
        }
        
        if (value !== undefined) {
          responsesArray.push({
            fieldId: field.id || field._id?.toString() || undefined,
            label: field.label,
            value: value
          });
        }
      }

      if (form.isPaymentEnabled && form.paymentAmount > 0) {
      const result = await submitFormResponse(form._id, responsesArray, 'pending');
      setIsSubmitting(false);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg("Something went wrong saving your response. Please try again.");
      }
    } else {
      const result = await submitFormResponse(form._id, responsesArray);
      setIsSubmitting(false);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
    }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="w-4 h-4 bg-[#1E4E8C] rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
            <div className="w-4 h-4 bg-[#C69C6D] rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
            <div className="w-4 h-4 bg-[#E86A28] rounded-full animate-bounce"></div>
          </div>
          <span className="text-gray-500 font-medium">Loading Form...</span>
        </div>
      </div>
    );
  }



  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF9F6]">
        <main className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-red-200 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
           <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Form Not Found</h2>
           <p className="text-gray-600 font-medium leading-relaxed">We couldn't find the form associated with this link. It may have been deleted or the link is broken.</p>
        </main>
      </div>
    );
  }

  if (form.isAcceptingResponses === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF9F6]">
        <main className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-amber-200 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
           <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Form Closed</h2>
           <p className="text-gray-600 font-medium leading-relaxed">This form is no longer accepting responses.</p>
        </main>
      </div>
    );
  }

  const themeProps = {
    form,
    responses,
    setResponses,
    isSubmitting,
    paymentConfirmed,
    setPaymentConfirmed,
    isSuccess,
    errorMsg,
    errorField,
    handleSubmit,
    showUndertakingModal,
    setShowUndertakingModal,
    currentUndertakingField,
    setCurrentUndertakingField
  };

  if (form.theme === 'fight-club') {
    return <FightClubTheme {...themeProps} />;
  }

  return <DefaultTheme {...themeProps} />;
}
