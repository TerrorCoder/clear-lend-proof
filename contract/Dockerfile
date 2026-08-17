# Compact compiler container — the compiler has no native Windows build,
# so we run it in Linux via Docker (works identically on any host).
FROM ubuntu:24.04

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates xz-utils unzip zstd gzip bzip2 \
  && rm -rf /var/lib/apt/lists/*

# Official installer for the `compact` developer tools CLI.
RUN curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh

ENV PATH="/root/.compact/bin:/root/.local/bin:/root/.local/share/compact/bin:${PATH}"

# Pre-fetch the actual compiler toolchain so compiles are offline/fast.
RUN compact update

WORKDIR /work
ENTRYPOINT ["compact"]
