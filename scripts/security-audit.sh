#!/usr/bin/env bash
# webToko — security audit lokal: CVE dependency, kebocoran secret, SAST (OWASP).
# Dipakai oleh: npm run security · command /security-audit · CI (bash scripts/security-audit.sh audit).
# Argumen opsional: audit | secrets | sast  (default: semua)
set -uo pipefail
cd "$(dirname "$0")/.."

# Advisory GHSA level high+ yang DITERIMA SADAR (dev-only, belum ada patch / butuh upgrade breaking).
# Setiap tambahan WAJIB dicatat di SECURITY.md beserta alasannya. Kosongkan bila sudah ada fix upstream.
ACCEPTED_ADVISORIES='GHSA-ggr8-5vv4-36mx|GHSA-vfj7-8cjw-p6xm' # deepmerge-ts (prisma CLI) · braces (eslint chain)

red()   { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }

fail=0

step_audit() {
  echo "==> Dependency CVE — npm audit (level high+, dengan allowlist dev-only)"
  local audit_json blocked
  if ! audit_json=$(npm audit --json 2>/dev/null); then :; fi # exit≠0 saat ada temuan — bukan kegagalan script
  if ! printf '%s' "$audit_json" | jq -e '.vulnerabilities' >/dev/null 2>&1; then
    fail=1; red "    GAGAL — npm audit tidak menghasilkan JSON valid (cek koneksi registry)."
    return
  fi
  blocked=$(printf '%s' "$audit_json" | jq -r --arg allow "$ACCEPTED_ADVISORIES" '
    [ .vulnerabilities | to_entries[]
      | select(.value.severity == "high" or .value.severity == "critical")
      | .value.via[] | select(type == "object")
      | (.url // "advisory-tanpa-url")
      | select(test($allow) | not) ]
    | unique | join("\n    ")')
  if [ -z "$blocked" ]; then
    green "    OK — tidak ada CVE high+ yang belum di-allowlist."
    echo "    (allowlist saat ini: deepmerge-ts & braces — dev-only, lihat SECURITY.md)"
  else
    fail=1
    red "    TEMUAN — CVE high+ yang TIDAK di-allowlist:"
    printf '    %s\n' "$blocked"
  fi
}

step_secrets() {
  echo "==> Secret leak — gitleaks"
  local rc=0 use_git=1
  if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
    use_git=0
  fi
  if [ "$use_git" -eq 1 ]; then
    gitleaks git --redact --no-banner --log-level warn || rc=$?
  else
    gitleaks dir . --redact --no-banner --log-level warn || rc=$?
  fi
  if [ "$rc" -eq 0 ]; then
    green "    OK — tidak ada secret terdeteksi."
  else
    fail=1
    red "    TEMUAN — potensi secret bocor:"
    if [ "$use_git" -eq 1 ]; then
      gitleaks git --redact --no-banner -v >&2 || true
    else
      gitleaks dir . --redact --no-banner -v >&2 || true
    fi
  fi
}

step_sast() {
  echo "==> SAST OWASP — semgrep"
  if semgrep scan --config p/owasp-top-ten --config p/typescript --config p/react \
      --metrics=off --quiet --error; then
    green "    OK — semgrep tidak menemukan finding."
  else
    fail=1; red "    TEMUAN — semgrep menemukan issue (detail di atas)."
  fi
}

case "${1:-all}" in
  audit)   step_audit ;;
  secrets) step_secrets ;;
  sast)    step_sast ;;
  all)     step_audit; echo; step_secrets; echo; step_sast ;;
  *)       red "Argumen tidak dikenal: ${1} (pakai: audit|secrets|sast)"; exit 2 ;;
esac

echo
if [ "$fail" -eq 0 ]; then
  green "✅ SECURITY AUDIT BERSIH"
else
  red "❌ SECURITY AUDIT MENEMUKAN MASALAH — perbaiki, atau dokumentasikan alasan penerimaan."
fi
exit "$fail"
