import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const TARGET_DIRS = [
  'src/components/forms',
  'src/components/landing',
  'src/components/medspa',
  'src/pages',
];

const PUBLIC_FORM_FILES = [
  'src/components/forms/FormInput.jsx',
  'src/components/forms/LeadCaptureModal.jsx',
  'src/components/forms/DemoBookingModal.jsx',
  'src/components/forms/DemoBookingInline.jsx',
  'src/components/forms/IndustryQualificationForm.jsx',
  'src/components/landing/LeadCaptureForm.jsx',
  'src/components/landing/ExitIntentPopup.jsx',
  'src/components/library/ResourceDownloadModal.jsx',
  'src/components/medspa/MedSpaDemoModal.jsx',
  'src/pages/Contact.jsx',
  'src/pages/ProductSignup.jsx',
  'src/pages/Start.jsx',
  'src/pages/OptOut.jsx',
  'src/pages/ForgotPassword.jsx',
  'src/pages/ResetPassword.jsx',
];

const STRICT = process.env.FORM_AUDIT_STRICT === 'true';

function walk(dir) {
  const absolute = path.join(REPO_ROOT, dir);
  if (!fs.existsSync(absolute)) return [];

  const entries = fs.readdirSync(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(entryPath));
      continue;
    }
    if (/\.(jsx|tsx|js|ts)$/.test(entry.name)) {
      files.push(entryPath.replace(/\\/g, '/'));
    }
  }
  return files;
}

function findLine(content, pattern) {
  const lines = content.split('\n');
  const index = lines.findIndex((line) => pattern.test(line));
  return index >= 0 ? index + 1 : null;
}

function reportFinding(findings, file, severity, message, line = null) {
  findings.push({ file, severity, line, message });
}

function auditFile(file) {
  const absolute = path.join(REPO_ROOT, file);
  if (!fs.existsSync(absolute)) return [];

  const content = fs.readFileSync(absolute, 'utf8');
  const findings = [];
  const isPublicForm = PUBLIC_FORM_FILES.includes(file);

  if (!isPublicForm) return findings;

  if (/\.functions\.invoke\(['"]submitLeadCapture['"]/.test(content)) {
    if (!/consent_given\s*:/.test(content)) {
      reportFinding(findings, file, 'error', 'submitLeadCapture payload is missing consent_given.');
    }
    if (!/consent_source\s*:/.test(content)) {
      reportFinding(findings, file, 'warn', 'submitLeadCapture payload is missing consent_source.');
    }
  }

  if (/\.functions\.invoke\(['"]scheduleDemoBooking['"]/.test(content)) {
    if (!/scheduled_date\s*:/.test(content) || !/scheduled_time\s*:/.test(content)) {
      reportFinding(findings, file, 'error', 'scheduleDemoBooking payload is missing scheduled_date or scheduled_time.');
    }
    if (!/consent_given\s*:/.test(content)) {
      reportFinding(findings, file, 'warn', 'scheduleDemoBooking payload is missing consent_given.');
    }
  }

  if (/event\.target\.name|e\.target\.name/.test(content)) {
    const handlerLine = findLine(content, /event\.target\.name|e\.target\.name/);
    if (!/name=/.test(content)) {
      reportFinding(findings, file, 'error', 'File reads event.target.name but contains no JSX name attributes.', handlerLine);
    }
  }

  if (/type=["']email["']/.test(content) && !/EMAIL_REGEX|EMAIL_RE|validateEmail/.test(content)) {
    reportFinding(findings, file, 'warn', 'Email input found without obvious email validation helper.');
  }

  if (/type=["']tel["']/.test(content) && !/replace\(\/\\D\/g|phoneDigits|validatePhone|normalizePhoneToE164/.test(content)) {
    reportFinding(findings, file, 'warn', 'Phone input found without obvious digit/phone validation helper.');
  }

  if (/type=["']checkbox["']/.test(content) && /value=/.test(content) && !/checked=/.test(content)) {
    reportFinding(findings, file, 'warn', 'Checkbox input appears to use value without checked.');
  }

  if (/setSubmitted\(true\)|setSuccess\(true\)/.test(content) && /\.functions\.invoke\(/.test(content) && !/\.data\?\.success|\.data\.success|result\?\.data\?\.success|res\.data\?\.success|response\?\.data\?\.url/.test(content)) {
    reportFinding(findings, file, 'warn', 'Form may show success after a backend invocation without checking response success.');
  }

  return findings;
}

const files = Array.from(new Set([
  ...TARGET_DIRS.flatMap(walk),
  ...PUBLIC_FORM_FILES,
]));

const findings = files.flatMap(auditFile);
const errors = findings.filter((finding) => finding.severity === 'error');
const warnings = findings.filter((finding) => finding.severity === 'warn');

console.log('Public form release checklist:');
for (const file of PUBLIC_FORM_FILES) {
  const exists = fs.existsSync(path.join(REPO_ROOT, file));
  const fileFindings = findings.filter((finding) => finding.file === file);
  const errorCount = fileFindings.filter((finding) => finding.severity === 'error').length;
  const warningCount = fileFindings.filter((finding) => finding.severity === 'warn').length;
  const status = !exists ? 'MISSING' : errorCount > 0 ? 'BLOCKED' : warningCount > 0 ? 'REVIEW' : 'PASS';
  console.log(`- ${status.padEnd(7)} ${file} (${errorCount} error, ${warningCount} warning)`);
}

if (findings.length === 0) {
  console.log('\nPublic form safety scan passed with no findings.');
} else {
  console.log('\nPublic form safety scan findings:');
  for (const finding of findings) {
    const location = finding.line ? `${finding.file}:${finding.line}` : finding.file;
    console.log(`- [${finding.severity.toUpperCase()}] ${location} — ${finding.message}`);
  }
}

console.log(`\nSummary: ${errors.length} error(s), ${warnings.length} warning(s). Strict mode: ${STRICT ? 'on' : 'off'}.`);

if (STRICT && errors.length > 0) {
  process.exit(1);
}
