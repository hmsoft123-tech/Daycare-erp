import type { ApiClient } from "@kinder-pilot/api-client";

/**
 * KinderPilot enrollment wizard API. Documents can only be uploaded against an
 * enrollment token (`POST /public/enrollment/{token}/documents`), and a submission
 * without document ids is rejected, so staff enrollment runs as a chain:
 * create inquiry → lock fees (issues challan + token) → upload documents → manual-submit.
 */

/**
 * Fallback company id when no tenant is resolved — normally the company is the
 * tenant resolved from the subdomain (`useTenantStore().tenantId`).
 */
export const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID ?? "1";

export type ApiDocumentType =
  | "CHILD_PASSPORT_PHOTO"
  | "PASSPORT_PHOTOS"
  | "FATHER_CNIC"
  | "MOTHER_CNIC"
  | "FAMILY_PHOTO"
  | "B_FORM_BIRTH_CERTIFICATE"
  | "ELECTRICITY_BILL"
  | "DIGITAL_SIGNATURE";

/** `TokenValidationResponse` */
export type ApiTokenValidation = {
  token: string;
  valid: boolean;
  inquiryId?: number;
  expiresAt?: string | null;
  childName?: string | null;
  childDob?: string | null;
  parentName?: string | null;
  parentEmail?: string | null;
  parentPhone?: string | null;
};

/** `EnrollmentSubmissionResponse` */
export type ApiEnrollmentSubmission = {
  submissionId: number;
  inquiryId: number;
  stage?: string;
  message?: string;
};

/** The wizard form fields the API payload is built from. */
export type EnrollmentWizardInput = {
  childFullName: string;
  dob: string;
  gender: "male" | "female" | "other";
  nationality: string;
  childIdNumber: string;
  previousSchool?: string;
  fatherName: string;
  fatherPhone: string;
  fatherCnic: string;
  fatherOccupation?: string;
  fatherEmail: string;
  motherName: string;
  motherPhone: string;
  motherCnic: string;
  motherOccupation?: string;
  motherEmail: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  allergies: string[];
  allergyDetails?: string;
  specialNeeds?: string;
  dietaryRestrictions?: string;
  branchId: string;
  daycareDropOff?: string;
  daycarePickUp?: string;
  termsAccepted: boolean;
};

export function splitChildName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") || parts[0] };
}

/** `EnrollmentWizardSubmitRequest` — shared by the public submit and staff manual-submit. */
export function wizardDataBody(
  data: EnrollmentWizardInput,
  program: string,
  documents: Partial<Record<ApiDocumentType, number>>
) {
  const { firstName, lastName } = splitChildName(data.childFullName);
  const allergies = [...data.allergies, data.allergyDetails].filter(Boolean).join(", ");
  const timings = [data.daycareDropOff, data.daycarePickUp].filter(Boolean).join(" – ");
  return {
    childProfile: {
      firstName,
      lastName,
      dateOfBirth: data.dob,
      gender: data.gender.toUpperCase(),
      nationality: data.nationality,
      bformNumber: data.childIdNumber,
      previousSchool: data.previousSchool || undefined,
      passportPhotoDocumentId: documents.CHILD_PASSPORT_PHOTO,
    },
    parents: {
      fatherName: data.fatherName,
      fatherCnic: data.fatherCnic,
      fatherPhone: data.fatherPhone,
      fatherEmail: data.fatherEmail,
      fatherOccupation: data.fatherOccupation || undefined,
      motherName: data.motherName,
      motherCnic: data.motherCnic,
      motherPhone: data.motherPhone,
      motherEmail: data.motherEmail,
      motherOccupation: data.motherOccupation || undefined,
    },
    emergencyContact: {
      emergencyContactName: data.emergencyName,
      emergencyContactPhone: data.emergencyPhone,
      emergencyContactRelation: data.emergencyRelation,
    },
    medicalCare: {
      allergies: allergies || undefined,
      dietaryRestrictions: data.dietaryRestrictions || undefined,
      specialMedicalNotes: data.specialNeeds || undefined,
    },
    programAndFees: {
      program,
      assignedBranchId: data.branchId || undefined,
      timingsSchedule: timings || undefined,
      feeAcknowledged: data.termsAccepted,
    },
    documentIds: Object.values(documents),
  };
}

/** The signature pad produces a PNG data URL; the API wants it as an uploaded file. */
export function dataUrlToFile(dataUrl: string, name: string): File {
  const [header, base64] = dataUrl.split(",");
  const type = /data:([^;]+)/.exec(header)?.[1] ?? "image/png";
  const bin = atob(base64 ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type });
}

/** Uploads each file against the enrollment token and returns the ids by document type. */
export async function uploadEnrollmentDocuments(
  publicApi: ApiClient,
  token: string,
  files: Partial<Record<ApiDocumentType, File>>
): Promise<Partial<Record<ApiDocumentType, number>>> {
  const ids: Partial<Record<ApiDocumentType, number>> = {};
  for (const [type, file] of Object.entries(files) as [ApiDocumentType, File][]) {
    const form = new FormData();
    form.append("file", file);
    const res = await publicApi.upload<{ documentId: number }>(
      `/enrollment/${encodeURIComponent(token)}/documents?documentType=${type}`,
      form
    );
    ids[type] = res.documentId;
  }
  return ids;
}
