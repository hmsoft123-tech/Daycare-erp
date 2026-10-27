import type { ApiClient } from "@kinder-pilot/api-client";

/**
 * KinderPilot enrollment wizard API. Documents are uploaded against an enrollment
 * token (`POST /public/enrollment/{token}/documents`) as soon as the parent picks
 * them, so submitting only sends the form with the collected document ids.
 * Staff (full-manual) enrollment has no token until the enrollment exists.
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
  residentialAddress: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  emergencyId?: string;
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

/**
 * `EnrollmentWizardSubmitRequest` — shared by the public submit and staff full-manual.
 * `programAndFees` is optional since fees are locked before the parent's form (stage 3c);
 * pass a program only when the wizard chose one (staff walk-in).
 */
export function wizardDataBody(
  data: EnrollmentWizardInput,
  program: string | null,
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
      primaryResidentialAddress: data.residentialAddress || undefined,
    },
    emergencyContact: {
      emergencyContactName: data.emergencyName,
      emergencyContactPhone: data.emergencyPhone,
      emergencyContactRelation: data.emergencyRelation,
      emergencyContactCnic: data.emergencyId || undefined,
    },
    medicalCare: {
      allergies: allergies || undefined,
      dietaryRestrictions: data.dietaryRestrictions || undefined,
      specialMedicalNotes: data.specialNeeds || undefined,
    },
    programAndFees: program
      ? {
          program,
          assignedBranchId: data.branchId || undefined,
          timingsSchedule: timings || undefined,
          feeAcknowledged: data.termsAccepted,
        }
      : undefined,
    documentIds: Object.values(documents).filter((id): id is number => typeof id === "number"),
  };
}

/** Largest file the upload accepts (the BFF limit is 15 MB per request). */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/**
 * Phone photos are often 4–8 MB; scans and photos only need to be legible, so large
 * images are downscaled to ≤1600 px JPEG before upload. PDFs and small files pass through.
 */
export async function compressForUpload(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) || file.size < 400 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; // transparent PNG areas would turn black in JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // e.g. HEIC the browser cannot decode — upload as is
  }
}

/** Uploads one document against the enrollment token; resolves to its document id. */
export async function uploadEnrollmentDocument(
  publicApi: ApiClient,
  token: string,
  type: ApiDocumentType,
  file: File
): Promise<number> {
  const form = new FormData();
  form.append("file", await compressForUpload(file));
  const res = await publicApi.upload<{ documentId: number }>(
    `/enrollment/${encodeURIComponent(token)}/documents?documentType=${type}`,
    form
  );
  return res.documentId;
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

/** Uploads all files in parallel against the enrollment token; returns the ids by document type. */
export async function uploadEnrollmentDocuments(
  publicApi: ApiClient,
  token: string,
  files: Partial<Record<ApiDocumentType, File>>
): Promise<Partial<Record<ApiDocumentType, number>>> {
  const entries = Object.entries(files) as [ApiDocumentType, File][];
  const ids = await Promise.all(
    entries.map(([type, file]) => uploadEnrollmentDocument(publicApi, token, type, file))
  );
  return Object.fromEntries(entries.map(([type], i) => [type, ids[i]]));
}
