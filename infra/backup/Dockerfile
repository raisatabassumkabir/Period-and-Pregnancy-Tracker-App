# Nightly encrypted Postgres backups to S3-compatible storage (Cloudflare R2).
# Same major version as the db service so pg_dump can read the server.
FROM postgres:16-alpine

# The remote is defined by RCLONE_CONFIG_BACKUP_* env vars; the empty config
# file only stops rclone logging "config file not found" on every run.
RUN apk add --no-cache age rclone \
    && install -d -o postgres /etc/rclone \
    && touch /etc/rclone/rclone.conf
ENV RCLONE_CONFIG=/etc/rclone/rclone.conf

COPY --chmod=0755 backup.sh /usr/local/bin/backup.sh

USER postgres
ENTRYPOINT ["/usr/local/bin/backup.sh"]
CMD ["schedule"]
