# Access and Consent Rules

(Aligned with GDPR and HIPAA Principles)

This document defines how access to healthcare data is controlled in the system.
All rules are designed to reflect real-world regulatory expectations under
GDPR and HIPAA, focusing on confidentiality, least privilege, consent,
auditability, and data protection by design.

---

## 1. General Regulatory Principles

- All access to healthcare data is denied by default.
- Users must be authenticated and authorized before accessing any data.
- Access is granted strictly based on role, purpose, and patient consent.
- Only the minimum necessary data required for a task may be accessed.
- All access attempts, successful or failed, must be logged.
- Data access rules must be enforced consistently across the system.

(Reflects: GDPR Article 5 – data minimization, HIPAA Minimum Necessary Rule)

---

## 2. Patient Access Rules

- A patient may access only their own medical records.
- A patient may view their diagnoses, prescriptions, and lab reports.
- A patient may grant explicit consent to specific healthcare professionals.
- A patient may define the scope and duration of consent.
- A patient may revoke consent at any time without justification.
- Consent revocation must take effect immediately.
- A patient may view an access history showing who accessed their data and when.
- A patient may request data deletion or anonymization where legally permitted.

(Reflects: GDPR consent, right to access, right to erasure, transparency)

---

## 3. Doctor Access Rules

- A doctor may access patient data only if valid and active consent exists.
- A doctor may access only patients assigned to their care.
- A doctor may view medical history, prescriptions, and lab results for consented patients.
- A doctor may create and update diagnoses and treatment notes.
- A doctor may issue and update prescriptions.
- A doctor may not access patient data once consent is revoked or expired.
- All doctor access actions must be logged for accountability.

(Reflects: HIPAA access control, accountability, audit controls)

---

## 4. Nurse Access Rules

- A nurse may access limited patient data necessary for care delivery.
- A nurse may view assigned patient information with valid authorization.
- A nurse may record vitals and treatment-related updates.
- A nurse may not create or modify diagnoses or prescriptions.
- A nurse may not access patient data outside assigned responsibilities.
- All nurse access actions must be logged.

(Reflects: HIPAA Minimum Necessary Rule, role-based access)

---

## 5. Lab Technician Access Rules

- A lab technician may access only lab test requests assigned to them.
- A lab technician may upload and edit lab results before final publication.
- Once published, lab results become read-only.
- A lab technician may not access full patient medical histories.
- All lab-related access actions must be logged.

(Reflects: HIPAA role-based access, data minimization)

---

## 6. Administrator Access Rules

- An administrator may manage users, roles, and permissions.
- An administrator may view system-wide audit logs.
- An administrator may configure security, backup, and compliance settings.
- An administrator may not access patient medical records.
- Administrative access must follow least-privilege principles.

(Reflects: separation of duties, GDPR accountability)

---

## 7. Consent Management Rules

- Consent must be explicit, informed, and recorded.
- Consent must specify who can access data and for what purpose.
- Consent records must include status, scope, and expiry.
- Consent revocation must be logged and enforced immediately.
- Historical consent records must be retained for compliance review.

(Reflects: GDPR lawful processing, HIPAA authorization requirements)

---

## 8. Audit and Logging Rules

- All data access attempts must be logged with:
  - User identity
  - Patient identity
  - Action performed
  - Timestamp
  - Access outcome (allowed or denied)
- Audit logs must be tamper-resistant.
- Audit logs must be retained for compliance and investigation.
- Audit logs must be accessible only to authorized administrators.

(Reflects: HIPAA audit controls, GDPR accountability)

---

## 9. Security and Breach Handling Rules

- Unauthorized access attempts must be detected and recorded.
- Repeated failed access attempts must be flagged.
- Security incidents must be logged for review.
- The system must support breach analysis and reporting.

(Reflects: GDPR breach awareness, HIPAA security safeguards)

---

## 10. Data Protection Rules

- Sensitive healthcare data must be encrypted at rest.
- All data in transit must use secure communication protocols.
- Data must not be shared beyond defined consent and roles.
- Data handling must follow privacy-by-design principles.

(Reflects: GDPR Article 25, HIPAA Security Rule)
