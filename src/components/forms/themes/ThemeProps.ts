import React from "react";

export interface ThemeProps {
  form: any;
  responses: Record<string, string>;
  setResponses: (responses: Record<string, string>) => void;
  isSubmitting: boolean;
  paymentConfirmed: boolean;
  setPaymentConfirmed: (val: boolean) => void;
  isSuccess: boolean;
  errorMsg: string;
  errorField: string | null;
  handleSubmit: (e: React.FormEvent) => void;
  showUndertakingModal: boolean;
  setShowUndertakingModal: (val: boolean) => void;
  currentUndertakingField: string | null;
  setCurrentUndertakingField: (val: string | null) => void;
}
