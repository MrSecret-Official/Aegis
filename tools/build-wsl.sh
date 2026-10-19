#!/usr/bin/env bash
# Lanza tools/aegis.py dentro de WSL Arch, como el usuario sin privilegios «aegis».
#
#   wsl -d archlinux -u root -- bash /mnt/c/.../Aegis/tools/build-wsl.sh <orden de aegis.py> [args…]
#   p. ej.: … build-wsl.sh prepare      … build-wsl.sh bootstrap      … build-wsl.sh build
#
# Como root solo prepara el entorno (paquetes base, msitools para desempaquetar el SDK de Windows y
# el usuario «aegis»); mach no se ejecuta como root. El árbol de Firefox y los objdirs viven en
# /home/aegis/aegis (ext4), nunca en /mnt/c.
# Registro: /home/aegis/aegis/registro/<orden>.log (el panel de Windows lo sigue).
set -Eeuo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
USUARIO=aegis
# msitools: desempaquetar el SDK de Windows. lib32-glibc y lib32-gcc-libs (repositorio multilib): el wine
# de Mozilla, que ejecuta herramientas de Windows como midl.exe al compilar para Windows, necesita el
# cargador de 32 bits (/lib/ld-linux.so.2).
PAQUETES=(base-devel git python python-pip gnupg curl unzip zip rsync which shellcheck xz openssl github-cli msitools
          lib32-glibc lib32-gcc-libs)

[ "$(id -u)" -eq 0 ] || { echo "✗ build-wsl.sh se lanza como root (wsl -u root)" >&2; exit 2; }
[ $# -ge 1 ] || { echo "uso: build-wsl.sh <orden de aegis.py> [args…]" >&2; exit 2; }

# Repositorio multilib (para lib32-*): en Arch viene comentado. Se activa una vez, con copia del original.
if ! grep -q '^\[multilib\]' /etc/pacman.conf; then
    cp -a /etc/pacman.conf /etc/pacman.conf.aegis-antes
    printf '\n[multilib]\nInclude = /etc/pacman.d/mirrorlist\n' >> /etc/pacman.conf
fi

# Paquetes base (una vez). En una WSL nueva el llavero de pacman puede no existir.
if ! pacman -Qq "${PAQUETES[@]}" >/dev/null 2>&1; then
    if [ ! -s /etc/pacman.d/gnupg/pubring.gpg ] && [ ! -s /etc/pacman.d/gnupg/pubring.kbx ]; then
        pacman-key --init
        pacman-key --populate archlinux
    fi
    # Arch no admite actualizaciones parciales: tras sincronizar, se actualiza todo (-Su).
    pacman -Sy --needed --noconfirm archlinux-keyring
    pacman -Su --needed --noconfirm "${PAQUETES[@]}"
fi

# Usuario sin privilegios para mach (con sudo sin contraseña solo para pacman: lo usa bootstrap).
if ! id "$USUARIO" >/dev/null 2>&1; then
    useradd -m -s /bin/bash "$USUARIO"
fi
SUDOERS=/etc/sudoers.d/90-aegis
if [ ! -f "$SUDOERS" ]; then
    printf '%s ALL=(root) NOPASSWD: /usr/bin/pacman\n' "$USUARIO" > "$SUDOERS.tmp"
    chmod 0440 "$SUDOERS.tmp"
    mv "$SUDOERS.tmp" "$SUDOERS"
fi

CASA="$(getent passwd "$USUARIO" | cut -d: -f6)"
REG="$CASA/aegis/registro"
install -d -o "$USUARIO" -g "$USUARIO" "$CASA/aegis" "$REG"
LOG="$REG/$1.log"

# Una orden a la vez sobre el mismo árbol (un `patch --check` del guardián durante un build, dos
# builds…): la segunda espera como mucho 10 s y, si no, se niega.
exec 9>"$CASA/aegis/.cerrojo"
chown "$USUARIO:$USUARIO" "$CASA/aegis/.cerrojo"
if ! flock -w 10 9; then
    echo "✗ ya hay otra orden de Aegis en marcha en WSL" >&2
    exit 1
fi
: > "$LOG"
chown "$USUARIO:$USUARIO" "$LOG"

echo "[INICIO] aegis.py $* ($(date '+%F %T'))" | tee -a "$LOG"
set +e
runuser -u "$USUARIO" -- env HOME="$CASA" AEGIS_WORK="$CASA/aegis" PYTHONUNBUFFERED=1 DISABLE_TELEMETRY=1 \
    python3 "$REPO/tools/aegis.py" "$@" 2>&1 | tee -a "$LOG"
codigo=${PIPESTATUS[0]}
set -e
if [ "$codigo" -eq 0 ]; then
    echo "[ÉXITO] ($(date '+%F %T'))" | tee -a "$LOG"
else
    echo "[FALLIDO] código $codigo ($(date '+%F %T'))" | tee -a "$LOG"
fi
exit "$codigo"
