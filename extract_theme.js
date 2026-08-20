const fs = require('fs');

const pageContent = fs.readFileSync('src/app/f/[shareId]/page.tsx', 'utf8');
const lines = pageContent.split('\n');

const imports = `import { motion, AnimatePresence } from "framer-motion";
import { ThemeProps } from "../ThemeProps";

export default function DefaultTheme({
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
}: ThemeProps) {
`;

const startIndex = lines.findIndex((line, i) => i > 140 && line.includes('return ('));
const endIndex = lines.length - 2;

const returnBlock = lines.slice(startIndex, endIndex).join('\n');
const themeComponent = imports + returnBlock + '\n}\n';

fs.mkdirSync('src/components/forms/themes/default', { recursive: true });
fs.writeFileSync('src/components/forms/themes/default/index.tsx', themeComponent);
console.log("Extracted DefaultTheme");
