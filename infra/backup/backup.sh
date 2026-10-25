#!/bin/sh
# Encrypted pg_dump -> S3-compatible bucket, with retention.
#
#   backup.sh once      take one backup now (also the restore-drill entry point)
#   backup.sh schedule  take one now, then every BACKUP_INTERVAL_SECONDS
#
# Encryption is age public-key: only BACKUP_AGE_RECIPIENT (the public key)
# lives on the server. The private key stays offline, so a leaked bucket token
# or a copied server env never exposes the reproductive-health data in a dump.
set -eu
set -o pipefail

: "${POSTGRES_HOST:?}" "${POSTGRES_DB:?}" "${POSTGRES_USER:?}" "${POSTGRES_PASSWORD:?}"
: "${BACKUP_AGE_RECIPIENT:?set to the age public key (age1...)}"
: "${BACKUP_BUCKET:?}"
BACKUP_PREFIX="${BACKUP_PREFIX:-postgres}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-30}"
BACKUP_INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"
# The container healthcheck reads this; see `backup.sh healthcheck`.
LAST_SUCCESS_FILE=/tmp/last-backup-success
# One interval plus two hours of slack before the container reports unhealthy.
HEALTHY_WITHIN_SECONDS=$((BACKUP_INTERVAL_SECONDS + 7200))

# rclone reads the "backup" remote from RCLONE_CONFIG_BACKUP_* env vars.
REMOTE_DIR="backup:${BACKUP_BUCKET}/${BACKUP_PREFIX}"

take_backup() {
  stamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
  object="${REMOTE_DIR}/${POSTGRES_DB}-${stamp}.dump.age"
  echo "[backup] dumping ${POSTGRES_DB} -> ${object}"

  # Custom format: compressed, and pg_restore can pick objects selectively.
  # Dumped as the superuser so RLS policies and grants come along.
  # rcat streams, so a dump that dies halfway still leaves an object behind:
  # write to .partial and only promote it once the whole pipeline succeeded.
  if ! PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
      --host "${POSTGRES_HOST}" --username "${POSTGRES_USER}" \
      --dbname "${POSTGRES_DB}" --format custom \
      | age --encrypt --recipient "${BACKUP_AGE_RECIPIENT}" \
      | rclone rcat "${object}.partial"; then
    rclone deletefile "${object}.partial" || true
    return 1
  fi
  # Explicit returns: under `take_backup || ...` set -e is off in here.
  rclone moveto "${object}.partial" "${object}" || return 1

  echo "[backup] pruning objects older than ${BACKUP_KEEP_DAYS} days"
  rclone delete --min-age "${BACKUP_KEEP_DAYS}d" "${REMOTE_DIR}" || return 1
  date +%s > "${LAST_SUCCESS_FILE}"
  echo "[backup] done"
}

# Unhealthy until a backup has succeeded recently, so Dokploy shows a red
# container instead of failures hiding in the logs.
check_health() {
  last="$(cat "${LAST_SUCCESS_FILE}" 2>/dev/null || echo 0)"
  [ $(( $(date +%s) - last )) -lt "${HEALTHY_WITHIN_SECONDS}" ]
}

case "${1:-schedule}" in
  once)
    take_backup
    ;;
  schedule)
    while true; do
      # A failed run must not kill the loop; the next interval retries.
      take_backup || echo "[backup] FAILED; retrying next interval" >&2
      sleep "${BACKUP_INTERVAL_SECONDS}"
    done
    ;;
  healthcheck)
    check_health
    ;;
  *)
    echo "usage: backup.sh [once|schedule|healthcheck]" >&2
    exit 64
    ;;
esac
