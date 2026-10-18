#!/usr/bin/env bash
# webToko — security audit lokal: CVE dependency, kebocoran secret, SAST (OWASP).
# Dipakai oleh: npm run security · command /security-audit · (nanti) CI.
set -uo pipefail
cd "$(dirname "$0")/.."

red()   { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }

fail=0

echo "==> [1/3] Dependency CVE — npm audit (level high+)"
if npm audit --audit-level=high; then
  green "    OK — tidak ada CVE level high+."
else
  fail=1; red "    TEMUAN — dependency punya CVE level high+ (detail di atas)."
fi

echo
echo "==> [2/3] Secret leak — gitleaks"
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  gitleaks git --redact --no-banner --log-level warn
else
  gitleaks dir . --redact --no-banner --log-level warn
fi
if [ $? -eq 0 ]; then
  green "    OK — tidak ada secret terdeteksi."
else
  fail=1; red "    TEMUAN — potensi secret bocor (detail di atas)."
fi

echo
echo "==> [3/3] SAST OWASP — semgrep"
if semgrep scan --config p/owasp-top-ten --config p/typescript --config p/react \
    --metrics=off --quiet --error; then
  green "    OK — semgrep tidak menemukan finding."
else
  fail=1; red "    TEMUAN — semgrep menemukan issue (detail di atas)."
fi

echo
if [ "$fail" -eq 0 ]; then
  green "✅ SECURITY AUDIT BERSIH"
else
  red "❌ SECURITY AUDIT MENEMUKAN MASALAH — perbaiki, atau dokumentasikan alasan penerimaan."
fi
exit "$fail"
