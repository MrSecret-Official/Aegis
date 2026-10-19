/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef AegisEscudosMotor_h
#define AegisEscudosMotor_h

#include "nsID.h"

// Aegis · Escudos: el motor del bloqueador, en Rust (src/lib.rs).
extern "C" {
nsresult aegis_escudos_motor_constructor(REFNSIID aIID, void** aResult);
}  // extern "C"

#endif  // AegisEscudosMotor_h
