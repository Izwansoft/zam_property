/**
 * Unit Tests — Tenant Onboarding Store
 *
 * Tests Zustand store for multi-step onboarding wizard:
 * step navigation, data persistence, document management,
 * emergency contacts, and submission lifecycle.
 *
 * @see modules/tenant/store/onboarding-store.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import {
  useTenantOnboardingStore,
  DEFAULT_ONBOARDING_DATA,
  type UploadedDocument,
} from '../store/onboarding-store';

// ---------------------------------------------------------------------------
// Reset store between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  act(() => {
    useTenantOnboardingStore.getState().reset();
  });
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('TenantOnboardingStore — initial state', () => {
  it('starts at step 1 with default data', () => {
    const state = useTenantOnboardingStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.isSubmitted).toBe(false);
    expect(state.data).toEqual(DEFAULT_ONBOARDING_DATA);
  });

  it('has empty documents and emergency contacts', () => {
    const { data } = useTenantOnboardingStore.getState();
    expect(data.documents).toEqual([]);
    expect(data.emergencyContacts).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Step navigation
// ---------------------------------------------------------------------------

describe('TenantOnboardingStore — step navigation', () => {
  it('nextStep increments from 1 to 2', () => {
    act(() => useTenantOnboardingStore.getState().nextStep());
    expect(useTenantOnboardingStore.getState().currentStep).toBe(2);
  });

  it('nextStep caps at step 4', () => {
    act(() => {
      const store = useTenantOnboardingStore.getState();
      store.setCurrentStep(4);
      store.nextStep();
    });
    expect(useTenantOnboardingStore.getState().currentStep).toBe(4);
  });

  it('prevStep decrements from 3 to 2', () => {
    act(() => {
      useTenantOnboardingStore.getState().setCurrentStep(3);
      useTenantOnboardingStore.getState().prevStep();
    });
    expect(useTenantOnboardingStore.getState().currentStep).toBe(2);
  });

  it('prevStep does not go below 1', () => {
    act(() => useTenantOnboardingStore.getState().prevStep());
    expect(useTenantOnboardingStore.getState().currentStep).toBe(1);
  });

  it('setCurrentStep jumps directly to a step', () => {
    act(() => useTenantOnboardingStore.getState().setCurrentStep(3));
    expect(useTenantOnboardingStore.getState().currentStep).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Data updates
// ---------------------------------------------------------------------------

describe('TenantOnboardingStore — updateData', () => {
  it('merges partial data into existing form data', () => {
    act(() => {
      useTenantOnboardingStore.getState().updateData({
        fullName: 'Sarah Tan',
        phone: '+60123456789',
        nationality: 'Malaysian',
      });
    });

    const { data } = useTenantOnboardingStore.getState();
    expect(data.fullName).toBe('Sarah Tan');
    expect(data.phone).toBe('+60123456789');
    expect(data.nationality).toBe('Malaysian');
    // Unset fields remain default
    expect(data.icNumber).toBe('');
    expect(data.employmentStatus).toBe('');
  });

  it('preserves existing data when updating other fields', () => {
    act(() => {
      useTenantOnboardingStore.getState().updateData({ fullName: 'Sarah Tan' });
    });
    act(() => {
      useTenantOnboardingStore.getState().updateData({ phone: '+60123456789' });
    });

    const { data } = useTenantOnboardingStore.getState();
    expect(data.fullName).toBe('Sarah Tan');
    expect(data.phone).toBe('+60123456789');
  });
});

// ---------------------------------------------------------------------------
// Document management
// ---------------------------------------------------------------------------

describe('TenantOnboardingStore — documents', () => {
  const mockDoc: UploadedDocument = {
    id: 'doc-001',
    type: 'IC_FRONT' as any,
    fileName: 'ic-front.jpg',
    fileUrl: '/uploads/ic-front.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
  };

  const mockDoc2: UploadedDocument = {
    id: 'doc-002',
    type: 'PASSPORT' as any,
    fileName: 'passport.jpg',
    fileUrl: '/uploads/passport.jpg',
    fileSize: 2048000,
    mimeType: 'image/jpeg',
  };

  it('addDocument appends a document', () => {
    act(() => useTenantOnboardingStore.getState().addDocument(mockDoc));

    const docs = useTenantOnboardingStore.getState().data.documents;
    expect(docs).toHaveLength(1);
    expect(docs[0]).toEqual(mockDoc);
  });

  it('addDocument appends multiple documents', () => {
    act(() => {
      useTenantOnboardingStore.getState().addDocument(mockDoc);
      useTenantOnboardingStore.getState().addDocument(mockDoc2);
    });

    expect(useTenantOnboardingStore.getState().data.documents).toHaveLength(2);
  });

  it('removeDocument removes by id', () => {
    act(() => {
      useTenantOnboardingStore.getState().addDocument(mockDoc);
      useTenantOnboardingStore.getState().addDocument(mockDoc2);
    });

    act(() => useTenantOnboardingStore.getState().removeDocument('doc-001'));

    const docs = useTenantOnboardingStore.getState().data.documents;
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe('doc-002');
  });
});

// ---------------------------------------------------------------------------
// Emergency contacts
// ---------------------------------------------------------------------------

describe('TenantOnboardingStore — emergency contacts', () => {
  const contact1 = {
    name: 'John Doe',
    phone: '+60198765432',
    relationship: 'Father',
  };

  const contact2 = {
    name: 'Jane Doe',
    phone: '+60112345678',
    relationship: 'Mother',
  };

  it('addEmergencyContact appends a contact', () => {
    act(() => useTenantOnboardingStore.getState().addEmergencyContact(contact1));

    const contacts = useTenantOnboardingStore.getState().data.emergencyContacts;
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe('John Doe');
  });

  it('removeEmergencyContact removes by index', () => {
    act(() => {
      useTenantOnboardingStore.getState().addEmergencyContact(contact1);
      useTenantOnboardingStore.getState().addEmergencyContact(contact2);
    });

    act(() => useTenantOnboardingStore.getState().removeEmergencyContact(0));

    const contacts = useTenantOnboardingStore.getState().data.emergencyContacts;
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe('Jane Doe');
  });
});

// ---------------------------------------------------------------------------
// Submission lifecycle
// ---------------------------------------------------------------------------

describe('TenantOnboardingStore — submission', () => {
  it('markSubmitted sets isSubmitted to true', () => {
    act(() => useTenantOnboardingStore.getState().markSubmitted());
    expect(useTenantOnboardingStore.getState().isSubmitted).toBe(true);
  });

  it('reset restores default state', () => {
    // Set up non-default state
    act(() => {
      const store = useTenantOnboardingStore.getState();
      store.setCurrentStep(3);
      store.updateData({ fullName: 'Sarah Tan', phone: '+60123456789' });
      store.addDocument({
        id: 'doc-001',
        type: 'IC_FRONT' as any,
        fileName: 'ic.jpg',
        fileUrl: '/uploads/ic.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });
      store.markSubmitted();
    });

    // Reset
    act(() => useTenantOnboardingStore.getState().reset());

    const state = useTenantOnboardingStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.isSubmitted).toBe(false);
    expect(state.data).toEqual(DEFAULT_ONBOARDING_DATA);
  });
});

// ---------------------------------------------------------------------------
// Full wizard flow simulation
// ---------------------------------------------------------------------------

describe('TenantOnboardingStore — full wizard flow', () => {
  it('completes a realistic 4-step flow', () => {
    const store = useTenantOnboardingStore.getState;

    // Step 1: Personal details
    act(() => {
      store().updateData({
        fullName: 'Sarah Tan',
        phone: '+60123456789',
        nationality: 'Malaysian',
        icNumber: '990101-14-5678',
        employmentStatus: 'EMPLOYED',
        employerName: 'Tech Corp Sdn Bhd',
        jobTitle: 'Software Engineer',
        monthlyIncome: '8000',
      });
      store().nextStep();
    });
    expect(store().currentStep).toBe(2);

    // Step 2: Upload documents
    act(() => {
      store().addDocument({
        id: 'doc-ic',
        type: 'IC_FRONT' as any,
        fileName: 'ic-front.jpg',
        fileUrl: '/uploads/ic-front.jpg',
        fileSize: 512000,
        mimeType: 'image/jpeg',
      });
      store().nextStep();
    });
    expect(store().currentStep).toBe(3);
    expect(store().data.documents).toHaveLength(1);

    // Step 3: Emergency contact
    act(() => {
      store().addEmergencyContact({
        name: 'John Tan',
        phone: '+60198765432',
        relationship: 'Father',
      });
      store().nextStep();
    });
    expect(store().currentStep).toBe(4);
    expect(store().data.emergencyContacts).toHaveLength(1);

    // Step 4: Review & submit
    act(() => store().markSubmitted());
    expect(store().isSubmitted).toBe(true);

    // Verify all data is preserved
    const final = store().data;
    expect(final.fullName).toBe('Sarah Tan');
    expect(final.employmentStatus).toBe('EMPLOYED');
    expect(final.documents).toHaveLength(1);
    expect(final.emergencyContacts).toHaveLength(1);
  });
});
