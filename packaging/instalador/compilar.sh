#!/bin/bash
# Aegis Setup · compila el instalador para Windows desde WSL (usuario aegis): copia packaging/instalador a
# ~/instalador (ext4, nunca en /mnt/c) y lo compila con poca prioridad. Uso: compilar.sh [release|desarrollo]
set -Eeuo pipefail
export PATH=$HOME/.cargo/bin:$PATH
PERFIL=${1:-release}
# La carpeta del instalador en el repo (se lanza con «bash /mnt/c/…/packaging/instalador/compilar.sh»).
REPO="$(cd "$(dirname "$0")" && pwd)"
rsync -a --delete --exclude target --exclude dist "$REPO/" ~/instalador/
cd ~/instalador
estado=0
nice -n 19 cargo build --profile "$PERFIL" --target x86_64-pc-windows-gnu -j 2 > ~/instalador/compilar.log 2>&1 || estado=$?
grep -v "^\s*Compiling\|^\s*Downloaded\|^\s*Downloading" ~/instalador/compilar.log | tail -150 || true
if [ $estado -eq 0 ]; then
  mkdir -p "$REPO/dist"
  cp "target/x86_64-pc-windows-gnu/$PERFIL/aegis-setup.exe" "$REPO/dist/aegis-setup.exe"
  cp Cargo.lock "$REPO/Cargo.lock"
  ls -l "$REPO/dist/aegis-setup.exe"
fi
echo "FIN $estado"
exit "$estado"
