# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Marca de Aegis (a partir de browser/branding/unofficial de Firefox). Lo lee configure.
# Aquí solo valen las variables «confvar» (nombre visible, id de macOS). La identidad en el sistema no
# va aquí: MOZ_APP_VENDOR y MOZ_APP_PROFILE solo se fijan con imply_option (parche
# 0200-branding/0001) y MOZ_APP_REMOTINGNAME en mozconfigs/common. Ver docs/PLAN.md.
# shellcheck shell=sh disable=SC2034

MOZ_APP_DISPLAYNAME=Aegis
MOZ_MACBUNDLE_ID=aegis
