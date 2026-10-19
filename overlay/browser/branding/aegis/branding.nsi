# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# Marca de Aegis para el instalador NSIS de Firefox (lo usa `mach package`; el instalador de Aegis es otro,
# docs/INSTALADOR.md). Aegis no tiene instalador mínimo de descarga: las URL de descarga apuntan a las
# releases de GitHub y no se usan.

# BrandFullNameInternal se usa en valores del registro y del sistema de archivos.
!define BrandFullNameInternal "Aegis"
!define BrandFullName         "Aegis"
!define CompanyName           "Aegis"
!define URLInfoAbout          "https://github.com/MrSecret-Official/Aegis"
!define HelpLink              "https://github.com/MrSecret-Official/Aegis"

!define URLStubDownloadX86 "https://github.com/MrSecret-Official/Aegis/releases/latest"
!define URLStubDownloadAMD64 "https://github.com/MrSecret-Official/Aegis/releases/latest"
!define URLStubDownloadAArch64 "https://github.com/MrSecret-Official/Aegis/releases/latest"
!define URLManualDownload "https://github.com/MrSecret-Official/Aegis/releases/latest"
!define URLSystemRequirements "https://github.com/MrSecret-Official/Aegis"
!define Channel "release"

# Certificado esperado por el instalador mínimo de descarga (Aegis no lo usa).
!define CertNameDownload   "Aegis"
!define CertIssuerDownload "Aegis"

# Dialog units are used so the UI displays correctly with the system's DPI
# settings.
!define PROFILE_CLEANUP_LABEL_TOP "35u"
!define PROFILE_CLEANUP_LABEL_LEFT "0"
!define PROFILE_CLEANUP_LABEL_WIDTH "100%"
!define PROFILE_CLEANUP_LABEL_HEIGHT "80u"
!define PROFILE_CLEANUP_LABEL_ALIGN "center"
!define PROFILE_CLEANUP_CHECKBOX_LEFT "center"
!define PROFILE_CLEANUP_CHECKBOX_WIDTH "100%"
!define PROFILE_CLEANUP_BUTTON_LEFT "center"
!define INSTALL_BLURB_TOP "137u"
!define INSTALL_BLURB_WIDTH "60u"
!define INSTALL_FOOTER_TOP "-48u"
!define INSTALL_FOOTER_WIDTH "250u"
!define INSTALL_INSTALLING_TOP "70u"
!define INSTALL_INSTALLING_LEFT "0"
!define INSTALL_INSTALLING_WIDTH "100%"
!define INSTALL_PROGRESS_BAR_TOP "112u"
!define INSTALL_PROGRESS_BAR_LEFT "20%"
!define INSTALL_PROGRESS_BAR_WIDTH "60%"
!define INSTALL_PROGRESS_BAR_HEIGHT "12u"

!define PROFILE_CLEANUP_CHECKBOX_TOP_MARGIN "20u"
!define PROFILE_CLEANUP_BUTTON_TOP_MARGIN "20u"
!define PROFILE_CLEANUP_BUTTON_X_PADDING "40u"
!define PROFILE_CLEANUP_BUTTON_Y_PADDING "4u"

# Font settings that can be customized for each channel
!define INSTALL_HEADER_FONT_SIZE 28
!define INSTALL_HEADER_FONT_WEIGHT 400
!define INSTALL_INSTALLING_FONT_SIZE 28
!define INSTALL_INSTALLING_FONT_WEIGHT 400

# UI Colors that can be customized for each channel
!define COMMON_TEXT_COLOR 0xFFFFFF
!define COMMON_BACKGROUND_COLOR 0x000000
!define INSTALL_INSTALLING_TEXT_COLOR 0xFFFFFF
