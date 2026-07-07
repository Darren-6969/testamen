// import { FieldDef } from '@/app/types';
// import { Payment } from '@/app/data/payments';

import { FieldDef } from "@/app/types";
import { Payment } from "@/app/data/payments";

export const customerInfoFields: FieldDef<Payment>[] = [
  {
    key: "customer_name",
    label: "CUSTOMER NAME",
    value: "",
    validationRules: { required: true },
  },
  {
    key: "customer_code",
    label: "ACCOUNT NO.",
    value: "",
    validationRules: { required: true },
  },
  {
    key: "contact_no",
    label: "CONTACT NO.",
    value: "",
    validationRules: { required: true },
  }
];

export const paymentInfoFields: FieldDef<Payment>[] = [
  {
    key: "reference_no",
    label: "TRANSACTION REF NO",
    value: "",
    validationRules: { required: false },
  },
  {
    key: "docdate",
    label: "PAYMENT DATE",
    value: "",
    type: "date",
    validationRules: { required: true },
  },
  {
    key: "payment_method",
    label: "PAYMENT METHOD",
    value: "",
    validationRules: { required: true },
  }
];

export const totalFields: FieldDef<Payment>[] = [
  {
    key: "amount",
    label: "TOTAL AMOUNT (RM)",
    value: "0.00",
    type: "number",
    validationRules: { required: true },
  }
];