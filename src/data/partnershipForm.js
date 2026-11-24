// @ts-check

export const collaborationTypes = [
  "체험·공간 입점",
  "제품·서비스 제휴",
  "공동 프로그램·마케팅",
  "기타",
];

/**
 * @typedef {object} InquiryField
 * @property {string} name
 * @property {string} label
 * @property {number} max
 * @property {"textarea" | "url" | "tel" | "email"} [type]
 * @property {boolean} [required]
 * @property {string} [autoComplete]
 * @property {string} [placeholder]
 */

/** @type {InquiryField[]} */
export const identityFields = [
  { name: "company", label: "기업명 / 매장명", required: true, max: 120, autoComplete: "organization" },
  { name: "contact", label: "담당자 이름", required: true, max: 80, autoComplete: "name" },
];

/** @type {InquiryField[]} */
export const contactFields = [
  { name: "phone", label: "연락처", max: 30, type: "tel", autoComplete: "tel" },
  { name: "email", label: "이메일", max: 254, type: "email", autoComplete: "email" },
];

/** @type {InquiryField[]} */
export const proposalFields = [
  { name: "proposal", label: "제휴 제안 내용", type: "textarea", max: 1200 },
  { name: "website", label: "기업 홈페이지 / SNS 주소", type: "url", max: 300, placeholder: "https://" },
];

export const inquiryFields = [...identityFields, ...contactFields, ...proposalFields];

/** @param {InquiryField} field @param {unknown} value */
function fieldError(field, value) {
  if (value != null && (typeof value !== "string" || value.includes("\0"))) return "입력 형식을 확인해 주세요.";
  const input = typeof value === "string" ? value.trim() : "";
  if (!input) return field.required ? `${field.label} 항목을 입력해 주세요.` : "";
  if (input.length > field.max) return `${field.max}자 이하로 입력해 주세요.`;
  if (field.type === "url" && (!/^https?:\/\//i.test(input) || !URL.canParse(input) || /\s/.test(input))) {
    return "http:// 또는 https://로 시작하는 주소를 입력해 주세요.";
  }
  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) return "이메일 주소를 확인해 주세요.";
  if (field.type === "tel" && (!/^\+?[0-9() .-]+$/.test(input) || input.replace(/\D/g, "").length < 7)) {
    return "연락처를 확인해 주세요.";
  }
  return "";
}

/** @param {Record<string, unknown>} values @param {unknown} types @param {unknown} consent */
export function validateInquiry(values, types, consent) {
  /** @type {Record<string, string>} */
  const errors = {};
  for (const field of inquiryFields) {
    const error = fieldError(field, values[field.name]);
    if (error) errors[field.name] = error;
  }
  if (!errors.phone && !errors.email && !String(values.phone ?? "").trim() && !String(values.email ?? "").trim()) {
    errors.reply = "연락처 또는 이메일 중 하나를 입력해 주세요.";
  }
  if (!Array.isArray(types) || !types.length || types.length > collaborationTypes.length ||
    new Set(types).size !== types.length || !types.every((type) => collaborationTypes.includes(type))) {
    errors.types = "협업 유형을 한 가지 이상 선택해 주세요.";
  }
  if (consent !== true) errors.consent = "개인정보 수집·이용에 동의해 주세요.";
  return errors;
}
