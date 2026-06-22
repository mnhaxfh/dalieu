import { create } from 'zustand';
import * as Crypto from 'expo-crypto';

export interface QualityCheck {
  blurScore: number;
  lightingScore: number;
  passed: boolean;
}

export interface Demographics {
  age: number;
  sex: 'Male' | 'Female' | 'Other' | '';
  chiefComplaint: string;
  bodySite: string;
  knownConditions?: string;
  conditionTags: string[];
  conditionNote: string;
}

export interface ExamFlags {
  removeHair: boolean;
  eyesBlurred: boolean;
  manualMaskApplied: boolean;
}

export interface ExamSessionState {
  sessionId: string;
  originalImageUri: string | null;
  maskedImageUri: string | null;
  croppedImageUri: string | null;
  finalImageUri: string | null;
  finalImageName: string;
  finalImageType: string;
  quality: QualityCheck;
  demographics: Demographics;
  flags: ExamFlags;
  faceBounds: { leftEye?: any, rightEye?: any, bounds?: any } | null;
  
  // Actions
  startNewSession: () => void;
  setOriginalImage: (uri: string) => void;
  setFaceBounds: (bounds: any) => void;
  setQuality: (quality: QualityCheck) => void;
  setMaskedImage: (uri: string, blurred: boolean, manuallyMasked: boolean) => void;
  setCroppedImage: (uri: string) => void;
  setFinalImage: (uri: string, name: string, type: string) => void;
  updateDemographics: (data: Partial<Demographics>) => void;
  setRemoveHairFlag: (value: boolean) => void;
}

const generateSessionId = () => Crypto.randomUUID();

const initialDemographics: Demographics = {
  age: 0,
  sex: '',
  chiefComplaint: '',
  bodySite: 'other',
  conditionTags: [],
  conditionNote: '',
};

const initialQuality: QualityCheck = {
  blurScore: 0,
  lightingScore: 0,
  passed: false,
};

const initialFlags: ExamFlags = {
  removeHair: true, // Default per plan
  eyesBlurred: false,
  manualMaskApplied: false,
};

export const useExamStore = create<ExamSessionState>((set) => ({
  sessionId: generateSessionId(),
  originalImageUri: null,
  maskedImageUri: null,
  croppedImageUri: null,
  finalImageUri: null,
  finalImageName: '',
  finalImageType: 'image/jpeg',
  quality: initialQuality,
  demographics: initialDemographics,
  flags: initialFlags,
  faceBounds: null,

  startNewSession: () => set({
    sessionId: generateSessionId(),
    originalImageUri: null,
    maskedImageUri: null,
    croppedImageUri: null,
    finalImageUri: null,
    finalImageName: '',
    quality: initialQuality,
    demographics: initialDemographics,
    flags: initialFlags,
    faceBounds: null,
  }),

  setOriginalImage: (uri) => set({ originalImageUri: uri }),
  setFaceBounds: (bounds) => set({ faceBounds: bounds }),
  
  setQuality: (quality) => set({ quality }),
  
  setMaskedImage: (uri, blurred, manuallyMasked) => set((state) => ({
    maskedImageUri: uri,
    flags: { ...state.flags, eyesBlurred: blurred, manualMaskApplied: manuallyMasked },
  })),
  
  setCroppedImage: (uri) => set({ croppedImageUri: uri }),
  
  setFinalImage: (uri, name, type) => set({
    finalImageUri: uri,
    finalImageName: name,
    finalImageType: type,
  }),
  
  updateDemographics: (data) => set((state) => ({
    demographics: { ...state.demographics, ...data },
  })),

  setRemoveHairFlag: (value) => set((state) => ({
    flags: { ...state.flags, removeHair: value },
  })),
}));
